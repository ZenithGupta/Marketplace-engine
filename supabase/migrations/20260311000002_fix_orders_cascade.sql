-- =============================================
-- FIX ORDERS TABLE FOREIGN KEY CASCADING
-- Changes ON DELETE SET NULL to ON DELETE CASCADE
-- So deleting a user also deletes their associated orders.
-- =============================================

-- Drop the old constraint for vendor_id
ALTER TABLE public.orders
DROP CONSTRAINT orders_vendor_id_fkey,
ADD CONSTRAINT orders_vendor_id_fkey
   FOREIGN KEY (vendor_id)
   REFERENCES public.profiles(id)
   ON DELETE CASCADE;

-- Drop the old constraint for buyer_id
ALTER TABLE public.orders
DROP CONSTRAINT orders_buyer_id_fkey,
ADD CONSTRAINT orders_buyer_id_fkey
   FOREIGN KEY (buyer_id)
   REFERENCES public.profiles(id)
   ON DELETE CASCADE;

-- Also update product_id in orders to cascade if a listing is deleted
ALTER TABLE public.orders
DROP CONSTRAINT orders_product_id_fkey,
ADD CONSTRAINT orders_product_id_fkey
   FOREIGN KEY (product_id)
   REFERENCES public.listings(id)
   ON DELETE CASCADE;
