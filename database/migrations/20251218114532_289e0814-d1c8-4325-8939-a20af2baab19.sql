
-- Create seller vouchers table (shop-specific vouchers)
CREATE TABLE public.seller_vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(seller_id, code)
);

-- Create seller tickets table
CREATE TABLE public.seller_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE DEFAULT generate_ticket_number(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seller ticket messages
CREATE TABLE public.seller_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.seller_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('seller', 'admin')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.seller_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for seller_vouchers
CREATE POLICY "Anyone can view active seller vouchers" ON public.seller_vouchers
  FOR SELECT USING (is_active = true AND valid_to >= now());

CREATE POLICY "Sellers can manage their vouchers" ON public.seller_vouchers
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
  ));

-- RLS Policies for seller_tickets
CREATE POLICY "Sellers can view their tickets" ON public.seller_tickets
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
  ));

CREATE POLICY "Sellers can create tickets" ON public.seller_tickets
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
  ));

CREATE POLICY "Sellers can update their tickets" ON public.seller_tickets
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.sellers WHERE id = seller_id AND user_id = auth.uid()
  ));

-- RLS Policies for seller_ticket_messages
CREATE POLICY "Ticket participants can view messages" ON public.seller_ticket_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.seller_tickets t
    JOIN public.sellers s ON s.id = t.seller_id
    WHERE t.id = ticket_id AND s.user_id = auth.uid()
  ));

CREATE POLICY "Sellers can send messages" ON public.seller_ticket_messages
  FOR INSERT WITH CHECK (
    sender_type = 'seller' AND
    EXISTS (
      SELECT 1 FROM public.seller_tickets t
      JOIN public.sellers s ON s.id = t.seller_id
      WHERE t.id = ticket_id AND s.user_id = auth.uid()
    )
  );
