
-- Product Bundles/Combos
CREATE TABLE public.product_bundles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  image_url TEXT,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.product_bundle_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_id UUID NOT NULL REFERENCES public.product_bundles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.product_packages(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stock Waitlist
CREATE TABLE public.stock_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.product_packages(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id, package_id)
);

-- Live Chat Support
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  admin_id UUID,
  status TEXT NOT NULL DEFAULT 'open',
  subject TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'user',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Gift Cards
CREATE TABLE public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  balance NUMERIC NOT NULL,
  purchaser_id UUID,
  purchaser_email TEXT,
  recipient_email TEXT,
  recipient_name TEXT,
  message TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_redeemed BOOLEAN NOT NULL DEFAULT false,
  redeemed_by UUID,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_bundles
CREATE POLICY "Product bundles are publicly readable" ON public.product_bundles
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage product bundles" ON public.product_bundles
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for product_bundle_items
CREATE POLICY "Product bundle items are publicly readable" ON public.product_bundle_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM product_bundles WHERE id = bundle_id AND is_active = true));
CREATE POLICY "Admins can manage product bundle items" ON public.product_bundle_items
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for stock_waitlist
CREATE POLICY "Users can view own waitlist" ON public.stock_waitlist
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add to waitlist" ON public.stock_waitlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove from waitlist" ON public.stock_waitlist
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all waitlist" ON public.stock_waitlist
  FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admins can update waitlist" ON public.stock_waitlist
  FOR UPDATE USING (is_admin(auth.uid()));

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view own chat rooms" ON public.chat_rooms
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users and admins can update chat rooms" ON public.chat_rooms
  FOR UPDATE USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND (user_id = auth.uid() OR is_admin(auth.uid()))));
CREATE POLICY "Users can send messages to their rooms" ON public.chat_messages
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM chat_rooms WHERE id = room_id AND (user_id = auth.uid() OR is_admin(auth.uid()))));
CREATE POLICY "Message senders can update their messages" ON public.chat_messages
  FOR UPDATE USING (sender_id = auth.uid() OR is_admin(auth.uid()));

-- RLS Policies for gift_cards
CREATE POLICY "Users can view own gift cards" ON public.gift_cards
  FOR SELECT USING (purchaser_id = auth.uid() OR redeemed_by = auth.uid() OR recipient_email = (SELECT email FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can create gift cards" ON public.gift_cards
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can redeem gift cards" ON public.gift_cards
  FOR UPDATE USING (auth.uid() IS NOT NULL AND is_redeemed = false);
CREATE POLICY "Admins can manage gift cards" ON public.gift_cards
  FOR ALL USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;

-- Function to generate gift card code
CREATE OR REPLACE FUNCTION public.generate_gift_card_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code TEXT;
BEGIN
  code := 'GC-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
  RETURN code;
END;
$$;
