-- Add image_url column to product_packages for game topup packages
ALTER TABLE public.product_packages 
ADD COLUMN IF NOT EXISTS image_url TEXT;