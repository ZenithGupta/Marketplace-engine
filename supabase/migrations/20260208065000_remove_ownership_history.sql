-- =============================================
-- REMOVE OWNERSHIP_HISTORY TABLE (MVP CLEANUP)
-- =============================================

-- 1. Drop RLS policies on ownership_history
DROP POLICY IF EXISTS "Anyone can view ownership history" ON public.ownership_history;
DROP POLICY IF EXISTS "No direct inserts to ownership_history" ON public.ownership_history;
DROP POLICY IF EXISTS "No updates to ownership_history" ON public.ownership_history;
DROP POLICY IF EXISTS "No deletes from ownership_history" ON public.ownership_history;

-- 2. Drop index
DROP INDEX IF EXISTS idx_ownership_history_listing;

-- 3. Drop the ownership_history table
DROP TABLE IF EXISTS public.ownership_history;

-- 4. Update accept_bid function to remove ownership_history INSERT
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

  -- 3. Transfer ownership and mark as sold
  UPDATE public.listings
  SET current_owner_id = v_bidder_id,
      status = 'SOLD',
      updated_at = NOW()
  WHERE id = v_listing_id;

  RETURN TRUE;
END;
$$;
