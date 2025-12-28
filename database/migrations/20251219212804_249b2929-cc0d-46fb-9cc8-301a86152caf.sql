-- =====================================
-- 1. SELLER INSIGHTS / ANALYTICS (#12)
-- =====================================

-- Product view tracking for analytics
CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_seconds INTEGER,
  source TEXT, -- 'search', 'category', 'wishlist', 'direct'
  device_type TEXT -- 'mobile', 'desktop', 'tablet'
);

-- Product click tracking (which elements clicked)
CREATE TABLE IF NOT EXISTS public.product_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  user_id UUID,
  click_type TEXT NOT NULL, -- 'image', 'title', 'price', 'buy_button', 'chat', 'wishlist'
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily aggregated seller analytics
CREATE TABLE IF NOT EXISTS public.seller_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  wishlist_adds INTEGER DEFAULT 0,
  wishlist_removes INTEGER DEFAULT 0,
  chat_initiations INTEGER DEFAULT 0,
  view_to_buy_rate NUMERIC(5,2) DEFAULT 0, -- percentage
  avg_view_duration INTEGER DEFAULT 0, -- seconds
  top_viewed_products UUID[] DEFAULT '{}',
  top_clicked_price_ranges JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_id, stat_date)
);

-- AI-generated selling suggestions
CREATE TABLE IF NOT EXISTS public.seller_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.seller_products(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL, -- 'price_reduction', 'title_change', 'tag_change', 'description_improve'
  original_value TEXT,
  suggested_value TEXT,
  reason TEXT,
  confidence_score NUMERIC(3,2), -- 0-1
  is_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================
-- 2. SHOP TERMS / CONTRACTS (#13)
-- =====================================

-- Shop policies/terms
CREATE TABLE IF NOT EXISTS public.shop_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true, -- must accept before buying
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Buyer policy acceptance logs
CREATE TABLE IF NOT EXISTS public.policy_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.shop_policies(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  order_id UUID REFERENCES public.seller_orders(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  policy_version_hash TEXT -- hash of policy content at acceptance time
);

-- =====================================
-- 3. ADVANCED INVENTORY MANAGEMENT (#15)
-- =====================================

-- Inventory groups/categories
CREATE TABLE IF NOT EXISTS public.inventory_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'folder',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add internal management fields to seller_products (via separate table to avoid altering)
CREATE TABLE IF NOT EXISTS public.product_inventory_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE UNIQUE,
  group_id UUID REFERENCES public.inventory_groups(id) ON DELETE SET NULL,
  cost_price NUMERIC(12,0) DEFAULT 0, -- giá vốn
  source TEXT, -- nguồn hàng
  internal_notes TEXT, -- ghi chú nội bộ (chỉ seller thấy)
  profit NUMERIC(12,0) GENERATED ALWAYS AS (
    CASE WHEN cost_price > 0 THEN 0 ELSE 0 END
  ) STORED, -- will calculate on read
  is_outdated BOOLEAN DEFAULT false,
  outdated_reason TEXT,
  last_price_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory alerts
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.seller_products(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'long_stock', 'low_profit', 'outdated_meta', 'price_below_cost'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================
-- 4. SHOP BRANDING (#16)
-- =====================================

-- Extended shop branding settings
CREATE TABLE IF NOT EXISTS public.shop_branding (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE UNIQUE,
  theme_preset TEXT DEFAULT 'default', -- 'default', 'dark', 'gaming', 'minimal', 'custom'
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#10B981',
  background_color TEXT,
  text_color TEXT,
  font_family TEXT DEFAULT 'Inter',
  banner_type TEXT DEFAULT 'image', -- 'image', 'video', 'gif'
  banner_url TEXT,
  banner_video_url TEXT,
  layout_style TEXT DEFAULT 'grid', -- 'grid', 'list', 'masonry'
  show_seller_avatar BOOLEAN DEFAULT true,
  show_stats BOOLEAN DEFAULT true,
  show_badges BOOLEAN DEFAULT true,
  custom_css TEXT,
  qr_code_url TEXT,
  subdomain TEXT UNIQUE, -- custom subdomain
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================
-- 5. API & WEBHOOK INTEGRATION (#17)
-- =====================================

-- Seller API keys
CREATE TABLE IF NOT EXISTS public.seller_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE DEFAULT ('sk_' || encode(gen_random_bytes(32), 'hex')),
  permissions JSONB DEFAULT '["read", "write"]',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seller webhooks
CREATE TABLE IF NOT EXISTS public.seller_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}', -- ['order.created', 'order.completed', 'dispute.opened']
  secret TEXT DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Webhook delivery logs
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.seller_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  is_success BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bulk import jobs
CREATE TABLE IF NOT EXISTS public.bulk_import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  file_name TEXT,
  file_url TEXT,
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  success_rows INTEGER DEFAULT 0,
  failed_rows INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================
-- 6. RISK CONTROL (#18)
-- =====================================

-- Seller risk settings
CREATE TABLE IF NOT EXISTS public.seller_risk_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE UNIQUE,
  block_new_buyers BOOLEAN DEFAULT false,
  new_buyer_threshold_days INTEGER DEFAULT 7, -- buyer account < X days old
  block_disputed_buyers BOOLEAN DEFAULT false,
  max_disputes_allowed INTEGER DEFAULT 3,
  max_concurrent_orders INTEGER DEFAULT 5,
  delay_delivery_for_risky BOOLEAN DEFAULT false,
  delay_minutes INTEGER DEFAULT 30,
  require_phone_verified BOOLEAN DEFAULT false,
  require_email_verified BOOLEAN DEFAULT true,
  min_buyer_completed_orders INTEGER DEFAULT 0,
  blacklisted_countries TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Buyer risk scores
CREATE TABLE IF NOT EXISTS public.buyer_risk_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID NOT NULL UNIQUE,
  risk_score INTEGER DEFAULT 0, -- 0-100, higher = riskier
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  disputed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  refunded_orders INTEGER DEFAULT 0,
  account_age_days INTEGER DEFAULT 0,
  is_phone_verified BOOLEAN DEFAULT false,
  is_email_verified BOOLEAN DEFAULT true,
  is_high_risk BOOLEAN DEFAULT false,
  risk_factors JSONB DEFAULT '[]',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================
-- 7. AI SUPPORT (#19)
-- =====================================

-- AI generated content for products
CREATE TABLE IF NOT EXISTS public.ai_product_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL, -- 'title', 'description', 'tags', 'price'
  original_content TEXT,
  suggested_content TEXT,
  ai_reasoning TEXT,
  confidence NUMERIC(3,2) DEFAULT 0.5,
  is_applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI content analysis results
CREATE TABLE IF NOT EXISTS public.ai_content_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'description_accuracy', 'proof_validity', 'image_quality'
  status TEXT NOT NULL, -- 'passed', 'warning', 'failed'
  findings JSONB DEFAULT '[]',
  score NUMERIC(3,2) DEFAULT 1.0,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI price predictions
CREATE TABLE IF NOT EXISTS public.ai_price_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  current_price NUMERIC(12,0),
  predicted_optimal_price NUMERIC(12,0),
  predicted_min_price NUMERIC(12,0),
  predicted_max_price NUMERIC(12,0),
  confidence NUMERIC(3,2) DEFAULT 0.5,
  factors JSONB DEFAULT '[]', -- reasons for prediction
  predicted_sale_probability NUMERIC(3,2), -- 0-1
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================
-- INDEXES FOR PERFORMANCE
-- =====================================

CREATE INDEX IF NOT EXISTS idx_product_views_product_id ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_viewed_at ON product_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_product_clicks_product_id ON product_clicks(product_id);
CREATE INDEX IF NOT EXISTS idx_seller_analytics_seller_date ON seller_analytics(seller_id, stat_date);
CREATE INDEX IF NOT EXISTS idx_shop_policies_seller_id ON shop_policies(seller_id);
CREATE INDEX IF NOT EXISTS idx_policy_acceptances_buyer_id ON policy_acceptances(buyer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_groups_seller_id ON inventory_groups(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_inventory_data_product_id ON product_inventory_data(product_id);
CREATE INDEX IF NOT EXISTS idx_seller_webhooks_seller_id ON seller_webhooks(seller_id);
CREATE INDEX IF NOT EXISTS idx_buyer_risk_scores_buyer_id ON buyer_risk_scores(buyer_id);
CREATE INDEX IF NOT EXISTS idx_ai_product_suggestions_product_id ON ai_product_suggestions(product_id);

-- =====================================
-- RLS POLICIES
-- =====================================

ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_risk_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_product_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_content_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_price_predictions ENABLE ROW LEVEL SECURITY;

-- Product views - anyone can insert, sellers can read their products
CREATE POLICY "Anyone can track views" ON product_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Sellers view own product views" ON product_views FOR SELECT 
  USING (product_id IN (SELECT id FROM seller_products WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())));

-- Product clicks - anyone can insert, sellers can read
CREATE POLICY "Anyone can track clicks" ON product_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Sellers view own product clicks" ON product_clicks FOR SELECT 
  USING (product_id IN (SELECT id FROM seller_products WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())));

-- Seller analytics - sellers see own
CREATE POLICY "Sellers view own analytics" ON seller_analytics FOR ALL 
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Seller suggestions - sellers see own
CREATE POLICY "Sellers manage own suggestions" ON seller_suggestions FOR ALL 
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Shop policies - public read, seller manage
CREATE POLICY "Anyone can view active policies" ON shop_policies FOR SELECT USING (is_active = true);
CREATE POLICY "Sellers manage own policies" ON shop_policies FOR ALL 
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Policy acceptances - buyers can insert own, sellers can view
CREATE POLICY "Buyers accept policies" ON policy_acceptances FOR INSERT 
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Buyers view own acceptances" ON policy_acceptances FOR SELECT 
  USING (buyer_id = auth.uid());
CREATE POLICY "Sellers view policy acceptances" ON policy_acceptances FOR SELECT 
  USING (policy_id IN (SELECT id FROM shop_policies WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())));

-- Inventory groups - seller only
CREATE POLICY "Sellers manage own groups" ON inventory_groups FOR ALL 
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Product inventory data - seller only
CREATE POLICY "Sellers manage own inventory data" ON product_inventory_data FOR ALL 
  USING (product_id IN (SELECT id FROM seller_products WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())));

-- Inventory alerts - seller only
CREATE POLICY "Sellers manage own alerts" ON inventory_alerts FOR ALL 
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Shop branding - public read, seller manage
CREATE POLICY "Anyone can view branding" ON shop_branding FOR SELECT USING (true);
CREATE POLICY "Sellers manage own branding" ON shop_branding FOR ALL 
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Seller API keys - seller only
CREATE POLICY "Sellers manage own API keys" ON seller_api_keys FOR ALL 
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Seller webhooks - seller only
CREATE POLICY "Sellers manage own webhooks" ON seller_webhooks FOR ALL 
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Webhook deliveries - seller only
CREATE POLICY "Sellers view own webhook deliveries" ON webhook_deliveries FOR SELECT 
  USING (webhook_id IN (SELECT id FROM seller_webhooks WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())));

-- Bulk import jobs - seller only
CREATE POLICY "Sellers manage own import jobs" ON bulk_import_jobs FOR ALL 
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Seller risk settings - seller only
CREATE POLICY "Sellers manage own risk settings" ON seller_risk_settings FOR ALL 
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

-- Buyer risk scores - system managed, sellers can view buyers
CREATE POLICY "Users view own risk score" ON buyer_risk_scores FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Sellers view buyer risk" ON buyer_risk_scores FOR SELECT 
  USING (EXISTS (SELECT 1 FROM sellers WHERE user_id = auth.uid()));

-- AI suggestions - seller only
CREATE POLICY "Sellers manage own AI suggestions" ON ai_product_suggestions FOR ALL 
  USING (product_id IN (SELECT id FROM seller_products WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())));

-- AI analysis - seller only
CREATE POLICY "Sellers view own AI analysis" ON ai_content_analysis FOR ALL 
  USING (product_id IN (SELECT id FROM seller_products WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())));

-- AI price predictions - seller only
CREATE POLICY "Sellers view own price predictions" ON ai_price_predictions FOR ALL 
  USING (product_id IN (SELECT id FROM seller_products WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE webhook_deliveries;