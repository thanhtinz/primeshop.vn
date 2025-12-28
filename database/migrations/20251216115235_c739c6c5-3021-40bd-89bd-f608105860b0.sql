-- Add style column to categories
ALTER TABLE public.categories 
ADD COLUMN style text NOT NULL DEFAULT 'premium';

-- Add style and price columns to products (price for game_account style)
ALTER TABLE public.products 
ADD COLUMN style text NOT NULL DEFAULT 'premium',
ADD COLUMN price numeric DEFAULT NULL,
ADD COLUMN account_info jsonb DEFAULT NULL;

-- Add index for style filtering
CREATE INDEX idx_categories_style ON public.categories(style);
CREATE INDEX idx_products_style ON public.products(style);