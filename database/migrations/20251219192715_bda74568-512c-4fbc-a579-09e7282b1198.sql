
-- 1. Product Pinning/Boosting system
CREATE TABLE IF NOT EXISTS public.product_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL CHECK (boost_type IN ('marketplace_top', 'category_top', 'recommended', 'shop_featured')),
  cost_per_day NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Boost pricing config
CREATE TABLE IF NOT EXISTS public.boost_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boost_type TEXT NOT NULL UNIQUE CHECK (boost_type IN ('marketplace_top', 'category_top', 'recommended', 'shop_featured')),
  price_per_day NUMERIC NOT NULL DEFAULT 10000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default pricing
INSERT INTO public.boost_pricing (boost_type, price_per_day) VALUES
  ('marketplace_top', 50000),
  ('category_top', 30000),
  ('recommended', 20000),
  ('shop_featured', 0)
ON CONFLICT (boost_type) DO NOTHING;

-- 2. Smart Account Handover system
CREATE TABLE IF NOT EXISTS public.account_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.seller_orders(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id),
  buyer_id UUID NOT NULL,
  account_id TEXT,
  account_password TEXT,
  email_account TEXT,
  email_password TEXT,
  recovery_info TEXT,
  additional_info JSONB DEFAULT '{}',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_at TIMESTAMPTZ,
  buyer_confirmed_received BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMPTZ,
  checklist_data JSONB DEFAULT '{"changed_password": false, "changed_email": false, "added_2fa": false, "verified_info": false}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'received', 'completed', 'disputed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Handover audit log
CREATE TABLE IF NOT EXISTS public.handover_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handover_id UUID NOT NULL REFERENCES public.account_handovers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('seller', 'buyer', 'system', 'admin')),
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Seller Financial system (extend sellers table with more wallet fields)
ALTER TABLE public.sellers 
ADD COLUMN IF NOT EXISTS pending_balance NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_balance NUMERIC NOT NULL DEFAULT 0;

-- Seller wallet transactions
CREATE TABLE IF NOT EXISTS public.seller_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sale', 'fee', 'withdrawal', 'refund', 'boost', 'escrow_release', 'escrow_lock', 'dispute_lock', 'dispute_release')),
  amount NUMERIC NOT NULL,
  balance_before NUMERIC NOT NULL DEFAULT 0,
  balance_after NUMERIC NOT NULL DEFAULT 0,
  reference_id UUID,
  reference_type TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seller withdrawals (enhanced)
ALTER TABLE public.withdrawal_requests 
ADD COLUMN IF NOT EXISTS withdrawal_type TEXT NOT NULL DEFAULT 'normal' CHECK (withdrawal_type IN ('normal', 'fast')),
ADD COLUMN IF NOT EXISTS fast_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_amount NUMERIC;

-- 4. Seller badges/levels
CREATE TABLE IF NOT EXISTS public.seller_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  icon TEXT,
  badge_color TEXT DEFAULT '#FFD700',
  requirements JSONB DEFAULT '{}',
  benefits JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default badges
INSERT INTO public.seller_badges (code, name, name_en, description, icon, badge_color, requirements, benefits) VALUES
  ('trusted', 'Trusted Seller', 'Trusted Seller', 'Người bán đáng tin cậy', 'Shield', '#4CAF50', '{"min_trust_score": 70, "min_sales": 10}', '{"fee_discount": 5}'),
  ('top_seller', 'Top Seller', 'Top Seller', 'Người bán hàng đầu', 'Trophy', '#FFD700', '{"min_trust_score": 85, "min_sales": 50}', '{"fee_discount": 10, "free_boosts": 3}'),
  ('low_dispute', 'Low Dispute', 'Low Dispute', 'Tỷ lệ tranh chấp thấp', 'ThumbsUp', '#2196F3', '{"max_dispute_rate": 2}', '{"priority_support": true}'),
  ('verified', 'Verified', 'Verified', 'Đã xác minh danh tính', 'BadgeCheck', '#9C27B0', '{"is_verified": true}', '{"badge_display": true}'),
  ('new_seller', 'New Seller', 'New Seller', 'Người bán mới', 'Sparkles', '#FF9800', '{}', '{}')
ON CONFLICT (code) DO NOTHING;

-- Seller earned badges
CREATE TABLE IF NOT EXISTS public.seller_earned_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.seller_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_id, badge_id)
);

-- 5. Seller stats table for dashboard
CREATE TABLE IF NOT EXISTS public.seller_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue NUMERIC NOT NULL DEFAULT 0,
  orders_count INT NOT NULL DEFAULT 0,
  products_sold INT NOT NULL DEFAULT 0,
  disputes_count INT NOT NULL DEFAULT 0,
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_id, stat_date)
);

-- 6. Buyer blacklist
CREATE TABLE IF NOT EXISTS public.seller_buyer_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_id, buyer_id)
);

-- 7. Seller notifications preferences
CREATE TABLE IF NOT EXISTS public.seller_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE UNIQUE,
  notify_new_order BOOLEAN NOT NULL DEFAULT true,
  notify_order_received BOOLEAN NOT NULL DEFAULT true,
  notify_dispute BOOLEAN NOT NULL DEFAULT true,
  notify_review BOOLEAN NOT NULL DEFAULT true,
  notify_escrow_release BOOLEAN NOT NULL DEFAULT true,
  notify_chat BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Seller levels/tiers
CREATE TABLE IF NOT EXISTS public.seller_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level INT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_en TEXT,
  min_sales INT NOT NULL DEFAULT 0,
  min_revenue NUMERIC NOT NULL DEFAULT 0,
  min_trust_score INT NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 10,
  benefits JSONB DEFAULT '{}',
  icon TEXT,
  color TEXT DEFAULT '#6366F1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default levels
INSERT INTO public.seller_levels (level, name, name_en, min_sales, min_revenue, min_trust_score, commission_rate, benefits, icon, color) VALUES
  (1, 'Người bán mới', 'New Seller', 0, 0, 0, 10, '{}', 'Seedling', '#9CA3AF'),
  (2, 'Người bán Bronze', 'Bronze Seller', 10, 1000000, 30, 8, '{"free_boosts_per_month": 1}', 'Medal', '#CD7F32'),
  (3, 'Người bán Silver', 'Silver Seller', 30, 5000000, 50, 6, '{"free_boosts_per_month": 3, "priority_listing": true}', 'Award', '#C0C0C0'),
  (4, 'Người bán Gold', 'Gold Seller', 100, 20000000, 70, 5, '{"free_boosts_per_month": 5, "priority_listing": true, "featured_badge": true}', 'Crown', '#FFD700'),
  (5, 'Người bán Diamond', 'Diamond Seller', 300, 100000000, 85, 3, '{"free_boosts_per_month": 10, "priority_listing": true, "featured_badge": true, "vip_support": true}', 'Gem', '#B9F2FF')
ON CONFLICT (level) DO NOTHING;

-- Add seller level to sellers table
ALTER TABLE public.sellers
ADD COLUMN IF NOT EXISTS seller_level_id UUID REFERENCES public.seller_levels(id),
ADD COLUMN IF NOT EXISTS dispute_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_orders_count INT NOT NULL DEFAULT 0;

-- 9. Seller flash sales
CREATE TABLE IF NOT EXISTS public.seller_flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC NOT NULL DEFAULT 10,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seller flash sale items
CREATE TABLE IF NOT EXISTS public.seller_flash_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flash_sale_id UUID NOT NULL REFERENCES public.seller_flash_sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  discount_percent NUMERIC,
  quantity_limit INT,
  quantity_sold INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Product combos
CREATE TABLE IF NOT EXISTS public.seller_product_combos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seller_combo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combo_id UUID NOT NULL REFERENCES public.seller_product_combos(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.product_boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boost_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_earned_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_buyer_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_flash_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_product_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_combo_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Boost pricing: public read
CREATE POLICY "Anyone can read boost pricing" ON public.boost_pricing FOR SELECT USING (true);
CREATE POLICY "Admins can manage boost pricing" ON public.boost_pricing FOR ALL USING (public.is_admin(auth.uid()));

-- Product boosts: seller can manage own
CREATE POLICY "Sellers can manage own boosts" ON public.product_boosts FOR ALL
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can read active boosts" ON public.product_boosts FOR SELECT USING (status = 'active');

-- Account handovers
CREATE POLICY "Sellers can manage own handovers" ON public.account_handovers FOR ALL
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));
CREATE POLICY "Buyers can view own handovers" ON public.account_handovers FOR SELECT
  USING (buyer_id = auth.uid());
CREATE POLICY "Buyers can update checklist" ON public.account_handovers FOR UPDATE
  USING (buyer_id = auth.uid());

-- Handover audit logs
CREATE POLICY "Participants can view handover logs" ON public.handover_audit_logs FOR SELECT
  USING (handover_id IN (
    SELECT id FROM public.account_handovers 
    WHERE seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
    OR buyer_id = auth.uid()
  ));

-- Seller wallet transactions
CREATE POLICY "Sellers can view own transactions" ON public.seller_wallet_transactions FOR SELECT
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

-- Badges
CREATE POLICY "Anyone can read badges" ON public.seller_badges FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage badges" ON public.seller_badges FOR ALL USING (public.is_admin(auth.uid()));

-- Earned badges
CREATE POLICY "Anyone can view earned badges" ON public.seller_earned_badges FOR SELECT USING (true);
CREATE POLICY "System manages earned badges" ON public.seller_earned_badges FOR ALL USING (public.is_admin(auth.uid()));

-- Daily stats
CREATE POLICY "Sellers can view own stats" ON public.seller_daily_stats FOR SELECT
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

-- Blacklist
CREATE POLICY "Sellers can manage own blacklist" ON public.seller_buyer_blacklist FOR ALL
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

-- Notification settings
CREATE POLICY "Sellers can manage own notifications" ON public.seller_notification_settings FOR ALL
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));

-- Seller levels
CREATE POLICY "Anyone can read seller levels" ON public.seller_levels FOR SELECT USING (true);

-- Flash sales
CREATE POLICY "Sellers can manage own flash sales" ON public.seller_flash_sales FOR ALL
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can view active flash sales" ON public.seller_flash_sales FOR SELECT
  USING (is_active = true AND start_time <= now() AND end_time >= now());

-- Flash sale items
CREATE POLICY "Sellers can manage flash sale items" ON public.seller_flash_sale_items FOR ALL
  USING (flash_sale_id IN (
    SELECT id FROM public.seller_flash_sales WHERE seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
  ));
CREATE POLICY "Anyone can view flash sale items" ON public.seller_flash_sale_items FOR SELECT USING (true);

-- Combos
CREATE POLICY "Sellers can manage own combos" ON public.seller_product_combos FOR ALL
  USING (seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can view active combos" ON public.seller_product_combos FOR SELECT
  USING (is_active = true);

-- Combo items
CREATE POLICY "Sellers can manage combo items" ON public.seller_combo_items FOR ALL
  USING (combo_id IN (
    SELECT id FROM public.seller_product_combos WHERE seller_id IN (SELECT id FROM public.sellers WHERE user_id = auth.uid())
  ));
CREATE POLICY "Anyone can view combo items" ON public.seller_combo_items FOR SELECT USING (true);

-- Functions

-- Function to create boost and deduct from balance
CREATE OR REPLACE FUNCTION public.create_product_boost(
  p_product_id UUID,
  p_boost_type TEXT,
  p_days INT
)
RETURNS TABLE(success BOOLEAN, message TEXT, boost_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id UUID;
  v_seller_balance NUMERIC;
  v_price_per_day NUMERIC;
  v_total_cost NUMERIC;
  v_boost_id UUID;
BEGIN
  -- Get seller
  SELECT s.id, s.balance INTO v_seller_id, v_seller_balance
  FROM sellers s
  JOIN seller_products sp ON sp.seller_id = s.id
  WHERE sp.id = p_product_id AND s.user_id = auth.uid();
  
  IF v_seller_id IS NULL THEN
    RETURN QUERY SELECT false, 'Sản phẩm không tồn tại hoặc không thuộc về bạn'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Get pricing
  SELECT price_per_day INTO v_price_per_day
  FROM boost_pricing
  WHERE boost_type = p_boost_type AND is_active = true;
  
  IF v_price_per_day IS NULL THEN
    RETURN QUERY SELECT false, 'Loại boost không hợp lệ'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  v_total_cost := v_price_per_day * p_days;
  
  -- Check balance
  IF v_seller_balance < v_total_cost THEN
    RETURN QUERY SELECT false, 'Số dư không đủ'::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Deduct balance
  UPDATE sellers
  SET balance = balance - v_total_cost, updated_at = now()
  WHERE id = v_seller_id;
  
  -- Create boost
  INSERT INTO product_boosts (product_id, seller_id, boost_type, cost_per_day, total_cost, end_date)
  VALUES (p_product_id, v_seller_id, p_boost_type, v_price_per_day, v_total_cost, now() + (p_days || ' days')::INTERVAL)
  RETURNING id INTO v_boost_id;
  
  -- Record transaction
  INSERT INTO seller_wallet_transactions (seller_id, type, amount, balance_before, balance_after, reference_id, reference_type, note)
  VALUES (v_seller_id, 'boost', -v_total_cost, v_seller_balance, v_seller_balance - v_total_cost, v_boost_id, 'boost', 'Thuê ghim sản phẩm ' || p_boost_type || ' ' || p_days || ' ngày');
  
  RETURN QUERY SELECT true, 'Ghim sản phẩm thành công!'::TEXT, v_boost_id;
END;
$$;

-- Function to record handover audit log
CREATE OR REPLACE FUNCTION public.log_handover_action(
  p_handover_id UUID,
  p_action TEXT,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
  v_actor_type TEXT;
BEGIN
  -- Determine actor type
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM account_handovers ah JOIN sellers s ON s.id = ah.seller_id WHERE ah.id = p_handover_id AND s.user_id = auth.uid()) THEN 'seller'
    WHEN EXISTS (SELECT 1 FROM account_handovers WHERE id = p_handover_id AND buyer_id = auth.uid()) THEN 'buyer'
    WHEN public.is_admin(auth.uid()) THEN 'admin'
    ELSE 'system'
  END INTO v_actor_type;
  
  INSERT INTO handover_audit_logs (handover_id, action, actor_id, actor_type, old_data, new_data)
  VALUES (p_handover_id, p_action, auth.uid(), v_actor_type, p_old_data, p_new_data)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Function to update seller level
CREATE OR REPLACE FUNCTION public.update_seller_level(p_seller_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller RECORD;
  v_new_level_id UUID;
BEGIN
  SELECT * INTO v_seller FROM sellers WHERE id = p_seller_id;
  
  SELECT id INTO v_new_level_id
  FROM seller_levels
  WHERE v_seller.total_sales >= min_sales
    AND v_seller.total_revenue >= min_revenue
    AND v_seller.trust_score >= min_trust_score
  ORDER BY level DESC
  LIMIT 1;
  
  IF v_new_level_id IS NOT NULL AND v_new_level_id != v_seller.seller_level_id THEN
    UPDATE sellers
    SET seller_level_id = v_new_level_id, updated_at = now()
    WHERE id = p_seller_id;
    
    -- Notify seller
    PERFORM create_notification(
      v_seller.user_id,
      'seller',
      'Nâng cấp seller!',
      'Chúc mừng! Shop của bạn đã được nâng cấp lên level mới!',
      '/seller'
    );
  END IF;
END;
$$;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION public.check_seller_badges(p_seller_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller RECORD;
  v_badge RECORD;
  v_requirements JSONB;
  v_dispute_rate NUMERIC;
BEGIN
  SELECT * INTO v_seller FROM sellers WHERE id = p_seller_id;
  
  -- Calculate dispute rate
  IF v_seller.total_sales > 0 THEN
    v_dispute_rate := (v_seller.dispute_count::NUMERIC / v_seller.total_sales) * 100;
  ELSE
    v_dispute_rate := 0;
  END IF;
  
  FOR v_badge IN SELECT * FROM seller_badges WHERE is_active = true LOOP
    v_requirements := v_badge.requirements;
    
    -- Check each requirement
    IF (v_requirements->>'min_trust_score' IS NULL OR v_seller.trust_score >= (v_requirements->>'min_trust_score')::INT)
       AND (v_requirements->>'min_sales' IS NULL OR v_seller.total_sales >= (v_requirements->>'min_sales')::INT)
       AND (v_requirements->>'max_dispute_rate' IS NULL OR v_dispute_rate <= (v_requirements->>'max_dispute_rate')::NUMERIC)
       AND (v_requirements->>'is_verified' IS NULL OR v_seller.is_verified = (v_requirements->>'is_verified')::BOOLEAN) THEN
      
      -- Award badge if not already earned
      INSERT INTO seller_earned_badges (seller_id, badge_id)
      VALUES (p_seller_id, v_badge.id)
      ON CONFLICT (seller_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Trigger to update seller stats after order completion
CREATE OR REPLACE FUNCTION public.update_seller_after_order_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE sellers
    SET completed_orders_count = completed_orders_count + 1, updated_at = now()
    WHERE id = NEW.seller_id;
    
    -- Check for level upgrade
    PERFORM update_seller_level(NEW.seller_id);
    
    -- Check for badges
    PERFORM check_seller_badges(NEW.seller_id);
  END IF;
  
  IF NEW.status = 'disputed' AND OLD.status != 'disputed' THEN
    UPDATE sellers
    SET dispute_count = dispute_count + 1, updated_at = now()
    WHERE id = NEW.seller_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_seller_order_complete ON public.seller_orders;
CREATE TRIGGER trigger_seller_order_complete
  AFTER UPDATE ON public.seller_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seller_after_order_complete();

-- Daily stats update function
CREATE OR REPLACE FUNCTION public.record_seller_daily_stat(
  p_seller_id UUID,
  p_revenue NUMERIC DEFAULT 0,
  p_orders INT DEFAULT 0,
  p_products_sold INT DEFAULT 0,
  p_disputes INT DEFAULT 0,
  p_views INT DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO seller_daily_stats (seller_id, stat_date, revenue, orders_count, products_sold, disputes_count, views_count)
  VALUES (p_seller_id, CURRENT_DATE, p_revenue, p_orders, p_products_sold, p_disputes, p_views)
  ON CONFLICT (seller_id, stat_date) DO UPDATE SET
    revenue = seller_daily_stats.revenue + p_revenue,
    orders_count = seller_daily_stats.orders_count + p_orders,
    products_sold = seller_daily_stats.products_sold + p_products_sold,
    disputes_count = seller_daily_stats.disputes_count + p_disputes,
    views_count = seller_daily_stats.views_count + p_views;
END;
$$;

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.account_handovers;
