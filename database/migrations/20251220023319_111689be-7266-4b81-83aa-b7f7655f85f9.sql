-- Create item shop purchases table to track all item shop transactions
CREATE TABLE public.item_shop_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type VARCHAR(50) NOT NULL, -- 'avatar_frame', 'name_color', 'prime_effect', 'prime_boost'
  item_id UUID NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_gift BOOLEAN DEFAULT FALSE,
  gift_recipient_id UUID,
  gift_recipient_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.item_shop_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view their own item shop purchases"
ON public.item_shop_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can insert their own item shop purchases"
ON public.item_shop_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_item_shop_purchases_user_id ON public.item_shop_purchases(user_id);
CREATE INDEX idx_item_shop_purchases_created_at ON public.item_shop_purchases(created_at DESC);