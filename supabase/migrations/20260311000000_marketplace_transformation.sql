-- =============================================
-- MARKETPLACE TRANSFORMATION: OLX → AMAZON MODEL
-- Adds roles, orders, stock, images. Removes bidding.
-- =============================================

-- =============================================
-- 1. UPDATE PROFILES TABLE (Add Roles & Store Info)
-- =============================================

ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'buyer' NOT NULL CHECK (role IN ('buyer', 'vendor', 'super_admin'));
ALTER TABLE public.profiles ADD COLUMN store_name TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN store_description TEXT DEFAULT NULL;

-- Index for role-based queries
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- =============================================
-- 2. UPDATE LISTINGS TABLE (Vendor Products)
-- =============================================

-- Rename owner to vendor
ALTER TABLE public.listings RENAME COLUMN current_owner_id TO vendor_id;

-- Add stock and image support
ALTER TABLE public.listings ADD COLUMN stock_quantity INTEGER DEFAULT 1 NOT NULL CHECK (stock_quantity >= 0);
ALTER TABLE public.listings ADD COLUMN image_url TEXT DEFAULT NULL;

-- Drop the old status enum and create new one
-- First, drop the old policies that depend on the old enum
DROP POLICY IF EXISTS "Anyone can view non-draft listings" ON public.listings;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can update their listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can delete their listings" ON public.listings;

-- First rename the column, drop the old type, create new type, re-add column
ALTER TABLE public.listings ALTER COLUMN status DROP DEFAULT;
ALTER TABLE public.listings ALTER COLUMN status TYPE TEXT;
DROP TYPE public.listing_status;
CREATE TYPE public.listing_status AS ENUM ('DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'ARCHIVED');
ALTER TABLE public.listings ALTER COLUMN status TYPE public.listing_status USING status::public.listing_status;
ALTER TABLE public.listings ALTER COLUMN status SET DEFAULT 'DRAFT';

-- Rename index
DROP INDEX IF EXISTS idx_listings_owner;
CREATE INDEX idx_listings_vendor ON public.listings(vendor_id);

-- =============================================
-- 3. CREATE ORDERS TABLE
-- =============================================

CREATE TYPE public.order_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  vendor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(12, 2) NOT NULL CHECK (total_price >= 0),
  status public.order_status DEFAULT 'PENDING' NOT NULL,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for orders
CREATE INDEX idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX idx_orders_vendor ON public.orders(vendor_id);
CREATE INDEX idx_orders_product ON public.orders(product_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Auto-update timestamp trigger for orders
CREATE TRIGGER on_orders_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- 4. DROP BID-RELATED OBJECTS
-- =============================================

-- Drop bid RLS policies
DROP POLICY IF EXISTS "Users can view their own bids" ON public.bids;
DROP POLICY IF EXISTS "Listing owners can view bids on their listings" ON public.bids;
DROP POLICY IF EXISTS "Users can create bids on eligible listings" ON public.bids;
DROP POLICY IF EXISTS "Bidders can update their open bids" ON public.bids;

-- Drop bid triggers
DROP TRIGGER IF EXISTS on_bids_update ON public.bids;

-- Drop bid-related functions
DROP FUNCTION IF EXISTS public.accept_bid(UUID);
DROP FUNCTION IF EXISTS public.reject_bid(UUID);
DROP FUNCTION IF EXISTS public.can_bid_on_listing(UUID);
DROP FUNCTION IF EXISTS public.is_listing_owner(UUID);

-- Drop bid indexes
DROP INDEX IF EXISTS idx_bids_listing;
DROP INDEX IF EXISTS idx_bids_bidder;
DROP INDEX IF EXISTS idx_bids_status;

-- Drop bids table and enum
DROP TABLE IF EXISTS public.bids;
DROP TYPE IF EXISTS public.bid_status;

-- =============================================
-- 5. CREATE PURCHASE FUNCTION (Atomic)
-- =============================================

CREATE OR REPLACE FUNCTION public.purchase_product(
  p_product_id UUID,
  p_quantity INTEGER DEFAULT 1,
  p_shipping_address JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vendor_id UUID;
  v_unit_price NUMERIC;
  v_stock INTEGER;
  v_order_id UUID;
  v_buyer_role TEXT;
BEGIN
  -- Verify buyer is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify buyer has buyer role
  SELECT role INTO v_buyer_role FROM public.profiles WHERE id = auth.uid();
  IF v_buyer_role != 'buyer' THEN
    RAISE EXCEPTION 'Only buyers can purchase products';
  END IF;

  -- Get product details with row lock
  SELECT vendor_id, base_price, stock_quantity
  INTO v_vendor_id, v_unit_price, v_stock
  FROM public.listings
  WHERE id = p_product_id
    AND status = 'ACTIVE'
  FOR UPDATE;

  IF v_vendor_id IS NULL THEN
    RAISE EXCEPTION 'Product not found or not available';
  END IF;

  -- Cannot buy own product
  IF v_vendor_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot buy your own product';
  END IF;

  -- Check stock
  IF v_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_stock, p_quantity;
  END IF;

  -- Create order
  INSERT INTO public.orders (
    product_id, buyer_id, vendor_id,
    quantity, unit_price, total_price,
    status, shipping_address
  ) VALUES (
    p_product_id, auth.uid(), v_vendor_id,
    p_quantity, v_unit_price, v_unit_price * p_quantity,
    'PENDING', p_shipping_address
  ) RETURNING id INTO v_order_id;

  -- Decrement stock
  UPDATE public.listings
  SET stock_quantity = stock_quantity - p_quantity,
      status = CASE
        WHEN stock_quantity - p_quantity <= 0 THEN 'OUT_OF_STOCK'::public.listing_status
        ELSE status
      END,
      updated_at = NOW()
  WHERE id = p_product_id;

  RETURN v_order_id;
END;
$$;

-- =============================================
-- 6. UPDATE LISTING RLS POLICIES
-- =============================================

-- Old listing policies were already dropped earlier in step 2

-- New listing policies
CREATE POLICY "Anyone can view active listings"
  ON public.listings FOR SELECT
  USING (status IN ('ACTIVE', 'OUT_OF_STOCK') OR vendor_id = auth.uid());

CREATE POLICY "Vendors can create listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (
    vendor_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'vendor')
  );

CREATE POLICY "Vendors can update their own listings"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (
    vendor_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'vendor')
  );

CREATE POLICY "Vendors can delete their own listings"
  ON public.listings FOR DELETE
  TO authenticated
  USING (
    vendor_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'vendor')
  );

-- =============================================
-- 7. ORDERS RLS POLICIES
-- =============================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Vendors can view orders for their products"
  ON public.orders FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

-- Orders are created via the purchase_product function (SECURITY DEFINER)
-- No direct INSERT policy needed for safety

CREATE POLICY "Vendors can update order status"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (vendor_id = auth.uid());
