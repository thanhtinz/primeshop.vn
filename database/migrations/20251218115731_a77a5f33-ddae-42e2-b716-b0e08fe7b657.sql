-- Add escrow fields to seller_orders
ALTER TABLE public.seller_orders 
ADD COLUMN IF NOT EXISTS escrow_release_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dispute_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
ADD COLUMN IF NOT EXISTS dispute_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS released_at TIMESTAMP WITH TIME ZONE;

-- Create disputes table for tracking dispute messages
CREATE TABLE IF NOT EXISTS public.seller_order_disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.seller_orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_order_disputes ENABLE ROW LEVEL SECURITY;

-- RLS policies for disputes
CREATE POLICY "Buyers can view their order disputes"
ON public.seller_order_disputes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.seller_orders so 
    WHERE so.id = order_id AND so.buyer_id = auth.uid()
  )
);

CREATE POLICY "Sellers can view their order disputes"
ON public.seller_order_disputes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.seller_orders so 
    JOIN public.sellers s ON so.seller_id = s.id
    WHERE so.id = order_id AND s.user_id::uuid = auth.uid()
  )
);

CREATE POLICY "Buyers can create disputes on their orders"
ON public.seller_order_disputes FOR INSERT
WITH CHECK (
  sender_type = 'buyer' AND
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.seller_orders so 
    WHERE so.id = order_id AND so.buyer_id = auth.uid()
  )
);

CREATE POLICY "Sellers can respond to disputes"
ON public.seller_order_disputes FOR INSERT
WITH CHECK (
  sender_type = 'seller' AND
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.seller_orders so 
    JOIN public.sellers s ON so.seller_id = s.id
    WHERE so.id = order_id AND s.user_id::uuid = auth.uid()
  )
);

-- Add withdrawal_type to track where money goes
ALTER TABLE public.withdrawal_requests
ADD COLUMN IF NOT EXISTS withdrawal_type TEXT DEFAULT 'bank';