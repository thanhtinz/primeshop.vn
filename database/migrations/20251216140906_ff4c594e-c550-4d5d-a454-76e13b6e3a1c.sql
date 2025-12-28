-- Table to store game account inventory
CREATE TABLE public.game_account_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  account_data TEXT NOT NULL, -- Account credentials (username, password, etc.)
  status TEXT NOT NULL DEFAULT 'available', -- available, sold, hidden
  sold_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for quick lookup of available accounts
CREATE INDEX idx_game_account_inventory_product_status ON public.game_account_inventory(product_id, status);
CREATE INDEX idx_game_account_inventory_sold_at ON public.game_account_inventory(sold_at) WHERE status = 'sold';

-- Enable RLS
ALTER TABLE public.game_account_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage game account inventory"
ON public.game_account_inventory
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Public can only see count of available accounts (not the actual data)
CREATE POLICY "Public can view available account count"
ON public.game_account_inventory
FOR SELECT
USING (status = 'available');

-- Trigger for updated_at
CREATE TRIGGER update_game_account_inventory_updated_at
BEFORE UPDATE ON public.game_account_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-hide sold accounts after 7 days
CREATE OR REPLACE FUNCTION public.auto_hide_sold_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.game_account_inventory
  SET status = 'hidden', updated_at = now()
  WHERE status = 'sold'
    AND sold_at IS NOT NULL
    AND sold_at < now() - INTERVAL '7 days';
END;
$$;

-- Function to get random available account for a product
CREATE OR REPLACE FUNCTION public.claim_random_account(p_product_id UUID, p_order_id UUID)
RETURNS TABLE (
  account_id UUID,
  account_data TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id UUID;
  v_account_data TEXT;
BEGIN
  -- Lock and select a random available account
  SELECT id, gai.account_data INTO v_account_id, v_account_data
  FROM public.game_account_inventory gai
  WHERE gai.product_id = p_product_id
    AND gai.status = 'available'
  ORDER BY random()
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF v_account_id IS NULL THEN
    RAISE EXCEPTION 'No available accounts for this product';
  END IF;
  
  -- Mark as sold
  UPDATE public.game_account_inventory
  SET status = 'sold',
      sold_at = now(),
      order_id = p_order_id,
      updated_at = now()
  WHERE id = v_account_id;
  
  RETURN QUERY SELECT v_account_id, v_account_data;
END;
$$;