-- =============================================
-- 1. VÍ ĐIỆN TỬ & P2P PAYMENTS
-- =============================================

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw', 'transfer_in', 'transfer_out', 'payment', 'refund', 'commission', 'reward')),
  amount NUMERIC NOT NULL,
  balance_before NUMERIC NOT NULL DEFAULT 0,
  balance_after NUMERIC NOT NULL DEFAULT 0,
  reference_type TEXT, -- 'order', 'transfer', 'deposit', 'affiliate'
  reference_id UUID,
  recipient_id UUID, -- for P2P transfers
  sender_id UUID, -- for P2P transfers
  note TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for wallet_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = recipient_id OR auth.uid() = sender_id);

CREATE POLICY "System can insert transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- P2P Transfer requests table
CREATE TABLE public.p2p_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.p2p_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their transfers"
  ON public.p2p_transfers FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create transfers"
  ON public.p2p_transfers FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their pending transfers"
  ON public.p2p_transfers FOR UPDATE
  USING (auth.uid() = sender_id AND status = 'pending');

-- =============================================
-- 2. AFFILIATE MARKETING SYSTEM
-- =============================================

-- Affiliates table
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  affiliate_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC NOT NULL DEFAULT 5 CHECK (commission_rate >= 0 AND commission_rate <= 50),
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC NOT NULL DEFAULT 0,
  pending_earnings NUMERIC NOT NULL DEFAULT 0,
  paid_earnings NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their affiliate profile"
  ON public.affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their affiliate profile"
  ON public.affiliates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their affiliate profile"
  ON public.affiliates FOR UPDATE
  USING (auth.uid() = user_id);

-- Public view for affiliate codes
CREATE POLICY "Anyone can view affiliate codes"
  ON public.affiliates FOR SELECT
  USING (status = 'active');

-- Affiliate clicks tracking
CREATE TABLE public.affiliate_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  visitor_ip TEXT,
  user_agent TEXT,
  referer TEXT,
  landing_page TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their clicks"
  ON public.affiliate_clicks FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- Affiliate conversions
CREATE TABLE public.affiliate_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  order_id UUID,
  customer_id UUID,
  order_amount NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their conversions"
  ON public.affiliate_conversions FOR SELECT
  USING (affiliate_id IN (SELECT id FROM public.affiliates WHERE user_id = auth.uid()));

-- Affiliate products (which products can be promoted)
CREATE TABLE public.affiliate_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  seller_id UUID,
  commission_rate NUMERIC NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active affiliate products"
  ON public.affiliate_products FOR SELECT
  USING (is_active = true);

-- =============================================
-- 3. AI CHATBOT
-- =============================================

-- AI Chat conversations
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  title TEXT,
  is_escalated BOOLEAN NOT NULL DEFAULT false,
  escalated_to UUID, -- staff user_id
  escalated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
  ON public.ai_conversations FOR SELECT
  USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Anyone can create conversations"
  ON public.ai_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their conversations"
  ON public.ai_conversations FOR UPDATE
  USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

-- AI Chat messages
CREATE TABLE public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON public.ai_messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM public.ai_conversations 
    WHERE user_id = auth.uid() OR session_id = current_setting('app.session_id', true)
  ));

CREATE POLICY "Anyone can insert messages"
  ON public.ai_messages FOR INSERT
  WITH CHECK (true);

-- FAQ for AI training
CREATE TABLE public.ai_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  keywords TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active FAQs"
  ON public.ai_faqs FOR SELECT
  USING (is_active = true);

-- =============================================
-- 4. VOICE/VIDEO CALL
-- =============================================

-- Call sessions
CREATE TABLE public.call_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id TEXT NOT NULL UNIQUE,
  caller_id UUID NOT NULL,
  callee_id UUID NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ringing', 'connected', 'ended', 'missed', 'declined')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their calls"
  ON public.call_sessions FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Users can create calls"
  ON public.call_sessions FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Participants can update call"
  ON public.call_sessions FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- =============================================
-- 5. ADVANCED SEARCH
-- =============================================

-- Search history
CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  query TEXT NOT NULL,
  filters JSONB,
  results_count INTEGER,
  clicked_result_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their search history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert search history"
  ON public.search_history FOR INSERT
  WITH CHECK (true);

-- Popular searches (aggregated)
CREATE TABLE public.popular_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL UNIQUE,
  search_count INTEGER NOT NULL DEFAULT 1,
  last_searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.popular_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view popular searches"
  ON public.popular_searches FOR SELECT
  USING (true);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to generate affiliate code
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  code TEXT;
BEGIN
  code := 'AFF' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  RETURN code;
END;
$$;

-- Function to process P2P transfer
CREATE OR REPLACE FUNCTION public.process_p2p_transfer(p_transfer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_transfer RECORD;
  v_sender_balance NUMERIC;
BEGIN
  -- Get transfer
  SELECT * INTO v_transfer FROM public.p2p_transfers WHERE id = p_transfer_id AND status = 'pending';
  
  IF v_transfer IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check sender balance
  SELECT balance INTO v_sender_balance FROM public.profiles WHERE user_id = v_transfer.sender_id;
  
  IF v_sender_balance < v_transfer.amount THEN
    UPDATE public.p2p_transfers SET status = 'failed' WHERE id = p_transfer_id;
    RETURN FALSE;
  END IF;
  
  -- Deduct from sender
  UPDATE public.profiles SET balance = balance - v_transfer.amount WHERE user_id = v_transfer.sender_id;
  
  -- Add to recipient
  UPDATE public.profiles SET balance = balance + v_transfer.amount WHERE user_id = v_transfer.recipient_id;
  
  -- Record transactions
  INSERT INTO public.wallet_transactions (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, recipient_id, note)
  VALUES (v_transfer.sender_id, 'transfer_out', -v_transfer.amount, v_sender_balance, v_sender_balance - v_transfer.amount, 'transfer', p_transfer_id, v_transfer.recipient_id, v_transfer.message);
  
  INSERT INTO public.wallet_transactions (user_id, type, amount, reference_type, reference_id, sender_id, note)
  SELECT v_transfer.recipient_id, 'transfer_in', v_transfer.amount, 'transfer', p_transfer_id, v_transfer.sender_id, v_transfer.message;
  
  -- Mark as completed
  UPDATE public.p2p_transfers SET status = 'completed', completed_at = now() WHERE id = p_transfer_id;
  
  -- Create notification for recipient
  PERFORM create_notification(
    v_transfer.recipient_id,
    'wallet',
    'Nhận tiền chuyển khoản',
    'Bạn đã nhận được ' || v_transfer.amount || 'đ từ chuyển khoản',
    '/profile?tab=wallet'
  );
  
  RETURN TRUE;
END;
$$;

-- Function to track affiliate click
CREATE OR REPLACE FUNCTION public.track_affiliate_click(p_affiliate_code TEXT, p_visitor_ip TEXT, p_user_agent TEXT, p_landing_page TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id UUID;
  v_click_id UUID;
BEGIN
  SELECT id INTO v_affiliate_id FROM public.affiliates WHERE affiliate_code = p_affiliate_code AND status = 'active';
  
  IF v_affiliate_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  INSERT INTO public.affiliate_clicks (affiliate_id, visitor_ip, user_agent, landing_page)
  VALUES (v_affiliate_id, p_visitor_ip, p_user_agent, p_landing_page)
  RETURNING id INTO v_click_id;
  
  UPDATE public.affiliates SET total_clicks = total_clicks + 1, updated_at = now() WHERE id = v_affiliate_id;
  
  RETURN v_click_id;
END;
$$;

-- Function to record affiliate conversion
CREATE OR REPLACE FUNCTION public.record_affiliate_conversion(p_affiliate_code TEXT, p_order_id UUID, p_customer_id UUID, p_order_amount NUMERIC)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate RECORD;
  v_commission NUMERIC;
  v_conversion_id UUID;
BEGIN
  SELECT * INTO v_affiliate FROM public.affiliates WHERE affiliate_code = p_affiliate_code AND status = 'active';
  
  IF v_affiliate IS NULL THEN
    RETURN NULL;
  END IF;
  
  v_commission := p_order_amount * (v_affiliate.commission_rate / 100);
  
  INSERT INTO public.affiliate_conversions (affiliate_id, order_id, customer_id, order_amount, commission_amount, commission_rate)
  VALUES (v_affiliate.id, p_order_id, p_customer_id, p_order_amount, v_commission, v_affiliate.commission_rate)
  RETURNING id INTO v_conversion_id;
  
  UPDATE public.affiliates 
  SET 
    total_conversions = total_conversions + 1,
    pending_earnings = pending_earnings + v_commission,
    total_earnings = total_earnings + v_commission,
    updated_at = now()
  WHERE id = v_affiliate.id;
  
  RETURN v_conversion_id;
END;
$$;

-- Enable realtime for call sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;

-- Indexes for performance
CREATE INDEX idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_conversions_affiliate_id ON public.affiliate_conversions(affiliate_id);
CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX idx_search_history_query ON public.search_history(query);
CREATE INDEX idx_call_sessions_caller ON public.call_sessions(caller_id);
CREATE INDEX idx_call_sessions_callee ON public.call_sessions(callee_id);