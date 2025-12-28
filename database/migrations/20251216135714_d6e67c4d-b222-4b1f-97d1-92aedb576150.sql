-- Add external API fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS external_api text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS external_category_id text DEFAULT NULL;

-- Add external product ID to product_packages table
ALTER TABLE public.product_packages
ADD COLUMN IF NOT EXISTS external_product_id text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.products.external_api IS 'External API provider (e.g., naperis)';
COMMENT ON COLUMN public.products.external_category_id IS 'Category ID from external API';
COMMENT ON COLUMN public.product_packages.external_product_id IS 'Product ID from external API';