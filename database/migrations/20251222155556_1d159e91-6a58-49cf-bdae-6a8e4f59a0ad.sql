-- Add shop_type column to sellers table
ALTER TABLE public.sellers 
ADD COLUMN shop_type TEXT DEFAULT 'game_account' CHECK (shop_type IN ('game_account', 'design'));