-- Add new content columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS short_description text,
ADD COLUMN IF NOT EXISTS warranty_info text,
ADD COLUMN IF NOT EXISTS usage_guide text;

-- Add comment for clarity
COMMENT ON COLUMN public.products.short_description IS 'Short description shown on product cards';
COMMENT ON COLUMN public.products.warranty_info IS 'Warranty information';
COMMENT ON COLUMN public.products.usage_guide IS 'Usage guide instructions';