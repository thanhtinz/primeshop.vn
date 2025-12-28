-- Add markup_percent column to product_packages for auto-pricing from source
ALTER TABLE product_packages 
ADD COLUMN IF NOT EXISTS markup_percent DECIMAL(5,2) DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN product_packages.markup_percent IS 'Markup percentage for auto-pricing. When source updates price, selling price = source_price * (1 + markup_percent/100)';
