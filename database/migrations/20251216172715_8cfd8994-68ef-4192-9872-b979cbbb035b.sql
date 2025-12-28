-- Add tags column to products table for game_topup products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];