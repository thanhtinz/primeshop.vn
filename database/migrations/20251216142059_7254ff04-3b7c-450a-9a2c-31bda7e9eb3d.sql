-- Add is_in_stock field to product_packages
ALTER TABLE public.product_packages
ADD COLUMN is_in_stock boolean NOT NULL DEFAULT true;