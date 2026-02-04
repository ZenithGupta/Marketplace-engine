-- =============================================
-- BASE MARKETPLACE ENGINE - DATABASE SCHEMA
-- =============================================

-- 1. Create listing status enum
CREATE TYPE public.listing_status AS ENUM ('DRAFT', 'ACTIVE', 'NEGOTIATING', 'SOLD', 'ARCHIVED');

-- 2. Create bid status enum
CREATE TYPE public.bid_status AS ENUM ('OPEN', 'ACCEPTED', 'REJECTED');

-- =============================================
-- TABLES
-- =============================================

-- 3. Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  reputation_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Listings table
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  base_price NUMERIC(12, 2) NOT NULL CHECK (base_price >= 0),
  metadata JSONB DEFAULT '{}'::jsonb,
  status public.listing_status DEFAULT 'DRAFT' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  bidder_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  message_to_seller TEXT,
  status public.bid_status DEFAULT 'OPEN' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. Ownership history table (immutable audit log)
CREATE TABLE public.ownership_history (
  id BIGSERIAL PRIMARY KEY,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  previous_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  new_owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  transfer_price NUMERIC(12, 2) NOT NULL,
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_listings_owner ON public.listings(current_owner_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_bids_listing ON public.bids(listing_id);
CREATE INDEX idx_bids_bidder ON public.bids(bidder_id);
CREATE INDEX idx_bids_status ON public.bids(status);
CREATE INDEX idx_ownership_history_listing ON public.ownership_history(listing_id);

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- =============================================

-- Check if current user owns a listing
CREATE OR REPLACE FUNCTION public.is_listing_owner(p_listing_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = p_listing_id AND current_owner_id = auth.uid()
  );
$$;

-- Check if current user can bid on a listing
CREATE OR REPLACE FUNCTION public.can_bid_on_listing(p_listing_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = p_listing_id
      AND current_owner_id != auth.uid()
      AND status IN ('ACTIVE', 'NEGOTIATING')
  );
$$;

-- =============================================
-- ATOMIC OWNERSHIP TRANSFER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.accept_bid(p_bid_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id UUID;
  v_bidder_id UUID;
  v_bid_amount NUMERIC;
  v_previous_owner_id UUID;
BEGIN
  -- Get bid details and verify ownership
  SELECT b.listing_id, b.bidder_id, b.amount, l.current_owner_id
  INTO v_listing_id, v_bidder_id, v_bid_amount, v_previous_owner_id
  FROM public.bids b
  JOIN public.listings l ON b.listing_id = l.id
  WHERE b.id = p_bid_id
    AND b.status = 'OPEN'
    AND l.current_owner_id = auth.uid()
    AND l.status IN ('ACTIVE', 'NEGOTIATING');

  IF v_listing_id IS NULL THEN
    RAISE EXCEPTION 'Invalid bid or unauthorized';
  END IF;

  -- 1. Mark the accepted bid
  UPDATE public.bids
  SET status = 'ACCEPTED', updated_at = NOW()
  WHERE id = p_bid_id;

  -- 2. Reject all other open bids on this listing
  UPDATE public.bids
  SET status = 'REJECTED', updated_at = NOW()
  WHERE listing_id = v_listing_id
    AND id != p_bid_id
    AND status = 'OPEN';

  -- 3. Create ownership history record
  INSERT INTO public.ownership_history (
    listing_id,
    previous_owner_id,
    new_owner_id,
    transfer_price
  ) VALUES (
    v_listing_id,
    v_previous_owner_id,
    v_bidder_id,
    v_bid_amount
  );

  -- 4. Transfer ownership and mark as sold
  UPDATE public.listings
  SET current_owner_id = v_bidder_id,
      status = 'SOLD',
      updated_at = NOW()
  WHERE id = v_listing_id;

  RETURN TRUE;
END;
$$;

-- Reject a bid function
CREATE OR REPLACE FUNCTION public.reject_bid(p_bid_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id UUID;
BEGIN
  -- Verify ownership and get listing
  SELECT b.listing_id INTO v_listing_id
  FROM public.bids b
  JOIN public.listings l ON b.listing_id = l.id
  WHERE b.id = p_bid_id
    AND b.status = 'OPEN'
    AND l.current_owner_id = auth.uid();

  IF v_listing_id IS NULL THEN
    RAISE EXCEPTION 'Invalid bid or unauthorized';
  END IF;

  UPDATE public.bids
  SET status = 'REJECTED', updated_at = NOW()
  WHERE id = p_bid_id;

  RETURN TRUE;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_listings_update
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_bids_update
  BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_profiles_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_history ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Anyone can view profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- LISTINGS POLICIES
CREATE POLICY "Anyone can view non-draft listings"
  ON public.listings FOR SELECT
  USING (status != 'DRAFT' OR current_owner_id = auth.uid());

CREATE POLICY "Authenticated users can create listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (current_owner_id = auth.uid());

CREATE POLICY "Owners can update their listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (current_owner_id = auth.uid());

CREATE POLICY "Owners can delete their listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (current_owner_id = auth.uid());

-- BIDS POLICIES
CREATE POLICY "Users can view their own bids"
  ON public.bids FOR SELECT
  TO authenticated
  USING (bidder_id = auth.uid());

CREATE POLICY "Listing owners can view bids on their listings"
  ON public.bids FOR SELECT
  TO authenticated
  USING (public.is_listing_owner(listing_id));

CREATE POLICY "Users can create bids on eligible listings"
  ON public.bids FOR INSERT
  TO authenticated
  WITH CHECK (
    bidder_id = auth.uid()
    AND public.can_bid_on_listing(listing_id)
  );

CREATE POLICY "Bidders can update their open bids"
  ON public.bids FOR UPDATE
  TO authenticated
  USING (bidder_id = auth.uid() AND status = 'OPEN');

-- OWNERSHIP HISTORY POLICIES
CREATE POLICY "Anyone can view ownership history"
  ON public.ownership_history FOR SELECT
  USING (true);

-- Prevent direct modification of ownership_history
CREATE POLICY "No direct inserts to ownership_history"
  ON public.ownership_history FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No updates to ownership_history"
  ON public.ownership_history FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from ownership_history"
  ON public.ownership_history FOR DELETE
  USING (false);