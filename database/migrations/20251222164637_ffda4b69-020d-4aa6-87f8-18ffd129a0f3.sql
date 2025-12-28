
-- =============================================
-- ADVANCED DESIGN SERVICES SYSTEM - PART 1
-- =============================================

-- 1. DEADLINE & MILESTONE SYSTEM
ALTER TABLE public.design_orders 
ADD COLUMN IF NOT EXISTS accept_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS draft_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS final_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS late_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS late_penalty_applied BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_milestone_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_milestone TEXT DEFAULT 'concept',
ADD COLUMN IF NOT EXISTS auto_matched BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS match_score NUMERIC(5,2);

-- 2. MILESTONE TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.design_order_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.design_orders(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('concept', 'draft', 'revision', 'final')),
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  escrow_amount NUMERIC(12,2) DEFAULT 0,
  escrow_status TEXT DEFAULT 'pending' CHECK (escrow_status IN ('pending', 'holding', 'released', 'refunded')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  buyer_feedback TEXT,
  seller_notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. LICENSE & COPYRIGHT SYSTEM
CREATE TABLE IF NOT EXISTS public.design_license_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  price_multiplier NUMERIC(4,2) DEFAULT 1.0,
  includes_commercial_use BOOLEAN DEFAULT false,
  includes_exclusive_rights BOOLEAN DEFAULT false,
  includes_source_files BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.design_license_types (code, name, name_en, description, price_multiplier, includes_commercial_use, includes_exclusive_rights, includes_source_files, sort_order) VALUES
('personal', 'Cá nhân', 'Personal', 'Sử dụng cá nhân, không thương mại', 1.0, false, false, false, 1),
('commercial', 'Thương mại', 'Commercial', 'Sử dụng cho mục đích thương mại', 1.5, true, false, true, 2),
('exclusive', 'Độc quyền', 'Exclusive', 'Quyền sở hữu độc quyền thiết kế', 3.0, true, true, true, 3)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.design_orders 
ADD COLUMN IF NOT EXISTS license_type_id UUID REFERENCES public.design_license_types(id),
ADD COLUMN IF NOT EXISTS license_price_multiplier NUMERIC(4,2) DEFAULT 1.0;

-- 4. NDA & PRIVACY SYSTEM
CREATE TABLE IF NOT EXISTS public.design_nda_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.design_orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL REFERENCES public.sellers(id),
  requires_nda BOOLEAN DEFAULT false,
  no_portfolio_use BOOLEAN DEFAULT false,
  confidentiality_period_days INTEGER DEFAULT 365,
  nda_fee NUMERIC(10,2) DEFAULT 0,
  buyer_signed_at TIMESTAMP WITH TIME ZONE,
  seller_signed_at TIMESTAMP WITH TIME ZONE,
  violated_at TIMESTAMP WITH TIME ZONE,
  violation_penalty NUMERIC(10,2),
  violation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.design_orders
ADD COLUMN IF NOT EXISTS requires_nda BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS no_portfolio_use BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS nda_fee NUMERIC(10,2) DEFAULT 0;

-- 5. EXTRA REVISION PACKAGES
CREATE TABLE IF NOT EXISTS public.design_revision_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.design_orders(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_per_revision NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  escrow_status TEXT DEFAULT 'pending' CHECK (escrow_status IN ('pending', 'holding', 'released', 'refunded')),
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.design_orders
ADD COLUMN IF NOT EXISTS base_revisions INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS extra_revisions_purchased INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS revisions_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS revision_price NUMERIC(10,2) DEFAULT 0;

-- 6. TEMPLATE SYSTEM FOR DESIGN FORMS
CREATE TABLE IF NOT EXISTS public.design_service_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.design_services(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id),
  name TEXT NOT NULL,
  description TEXT,
  form_fields JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.design_orders
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.design_service_templates(id),
ADD COLUMN IF NOT EXISTS form_data JSONB;

-- 7. TEAM PERMISSIONS IN TICKET
CREATE TABLE IF NOT EXISTS public.design_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  member_user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'designer', 'support', 'viewer')),
  can_view_orders BOOLEAN DEFAULT true,
  can_manage_orders BOOLEAN DEFAULT false,
  can_chat_buyers BOOLEAN DEFAULT false,
  can_manage_finances BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(seller_id, member_user_id)
);

CREATE TABLE IF NOT EXISTS public.design_order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.design_orders(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.design_team_members(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  is_primary BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.design_internal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.design_orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. EMAIL LOGS
CREATE TABLE IF NOT EXISTS public.design_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.design_orders(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.design_tickets(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_user_id UUID,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  template_used TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced'))
);

-- 9. ANTI-ABUSE & AI DETECTION
CREATE TABLE IF NOT EXISTS public.design_abuse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID,
  reported_user_id UUID NOT NULL,
  order_id UUID REFERENCES public.design_orders(id),
  ticket_id UUID REFERENCES public.design_tickets(id),
  abuse_type TEXT NOT NULL CHECK (abuse_type IN ('spam', 'fraud', 'harassment', 'malicious_file', 'other')),
  description TEXT,
  evidence JSONB,
  ai_confidence_score NUMERIC(5,2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'confirmed', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.design_user_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  risk_score NUMERIC(5,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  disputed_orders INTEGER DEFAULT 0,
  refunded_orders INTEGER DEFAULT 0,
  late_deliveries INTEGER DEFAULT 0,
  abuse_reports_received INTEGER DEFAULT 0,
  abuse_reports_confirmed INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.design_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_count INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  window_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, action_type)
);

-- 10. SELLER REWARDS & PENALTIES
CREATE TABLE IF NOT EXISTS public.design_seller_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('on_time_bonus', 'high_rating_bonus', 'volume_bonus', 'featured_listing', 'badge_earned')),
  amount NUMERIC(10,2) DEFAULT 0,
  description TEXT,
  order_id UUID REFERENCES public.design_orders(id),
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.design_seller_penalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  penalty_type TEXT NOT NULL CHECK (penalty_type IN ('late_delivery', 'dispute_lost', 'abuse_confirmed', 'nda_violation', 'quality_issue')),
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('warning', 'minor', 'major', 'critical')),
  amount NUMERIC(10,2) DEFAULT 0,
  trust_score_deduction INTEGER DEFAULT 0,
  description TEXT,
  order_id UUID REFERENCES public.design_orders(id),
  is_appealed BOOLEAN DEFAULT false,
  appeal_reason TEXT,
  appeal_status TEXT CHECK (appeal_status IN ('pending', 'approved', 'rejected')),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.sellers
ADD COLUMN IF NOT EXISTS design_on_time_rate NUMERIC(5,2) DEFAULT 100,
ADD COLUMN IF NOT EXISTS design_total_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_completed_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_avg_completion_days NUMERIC(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_total_revenue NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS design_penalties_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_rewards_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS design_last_online_at TIMESTAMP WITH TIME ZONE;

-- 11. DETAILED STATISTICS & REPORTS
CREATE TABLE IF NOT EXISTS public.design_seller_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL,
  orders_received INTEGER DEFAULT 0,
  orders_completed INTEGER DEFAULT 0,
  orders_cancelled INTEGER DEFAULT 0,
  orders_disputed INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  avg_completion_hours NUMERIC(8,2),
  on_time_count INTEGER DEFAULT 0,
  late_count INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  service_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(seller_id, stat_date)
);

CREATE TABLE IF NOT EXISTS public.design_admin_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL UNIQUE,
  total_orders INTEGER DEFAULT 0,
  total_revenue NUMERIC(12,2) DEFAULT 0,
  platform_fees NUMERIC(12,2) DEFAULT 0,
  disputes_opened INTEGER DEFAULT 0,
  disputes_resolved INTEGER DEFAULT 0,
  new_sellers INTEGER DEFAULT 0,
  new_buyers INTEGER DEFAULT 0,
  active_sellers INTEGER DEFAULT 0,
  top_categories JSONB,
  risk_sellers_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. MONETIZATION FEATURES
CREATE TABLE IF NOT EXISTS public.design_platform_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  fee_percent NUMERIC(5,2) DEFAULT 0,
  fee_fixed NUMERIC(10,2) DEFAULT 0,
  min_fee NUMERIC(10,2) DEFAULT 0,
  max_fee NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.design_platform_fees (fee_type, name, description, fee_percent, is_active) VALUES
('standard', 'Phí nền tảng', 'Phí cơ bản cho mỗi giao dịch', 10.0, true),
('nda', 'Phí NDA', 'Phí bảo mật thông tin', 0, true),
('priority_match', 'Phí ưu tiên match', 'Phí để được ưu tiên auto-match', 5.0, true),
('fast_withdraw', 'Phí rút tiền nhanh', 'Phí rút tiền trong 24h', 2.0, true),
('boost', 'Phí boost', 'Phí đẩy gian hàng lên top', 0, true)
ON CONFLICT (fee_type) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.design_seller_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'pro', 'vip')),
  fee_discount_percent NUMERIC(5,2) DEFAULT 0,
  priority_match_enabled BOOLEAN DEFAULT false,
  featured_listing_enabled BOOLEAN DEFAULT false,
  analytics_enabled BOOLEAN DEFAULT false,
  team_members_limit INTEGER DEFAULT 1,
  price NUMERIC(10,2) DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. WEBHOOKS FOR DESIGN SYSTEM
CREATE TABLE IF NOT EXISTS public.design_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret_key TEXT,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.design_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.design_webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT false,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 14. LEGAL AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.design_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.design_orders(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.design_tickets(id) ON DELETE SET NULL,
  user_id UUID,
  actor_type TEXT CHECK (actor_type IN ('buyer', 'seller', 'admin', 'system')),
  action TEXT NOT NULL,
  action_category TEXT CHECK (action_category IN ('order', 'payment', 'message', 'file', 'status', 'dispute', 'auth', 'other')),
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_audit_logs_order ON public.design_audit_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_design_audit_logs_ticket ON public.design_audit_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_design_audit_logs_user ON public.design_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_design_audit_logs_created ON public.design_audit_logs(created_at);

-- 15. AUTO-MATCH SCORING FOR SELLERS
CREATE TABLE IF NOT EXISTS public.design_seller_match_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE UNIQUE,
  categories TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  avg_response_time_hours NUMERIC(8,2) DEFAULT 24,
  avg_completion_days NUMERIC(8,2) DEFAULT 3,
  on_time_rate NUMERIC(5,2) DEFAULT 100,
  acceptance_rate NUMERIC(5,2) DEFAULT 100,
  current_workload INTEGER DEFAULT 0,
  max_concurrent_orders INTEGER DEFAULT 5,
  is_available BOOLEAN DEFAULT true,
  priority_score NUMERIC(8,2) DEFAULT 50,
  last_order_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.design_order_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_license_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_nda_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_revision_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_service_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_user_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_seller_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_seller_penalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_seller_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_admin_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_platform_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_seller_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_seller_match_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view license types" ON public.design_license_types FOR SELECT USING (true);
CREATE POLICY "Anyone can view platform fees" ON public.design_platform_fees FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their order milestones" ON public.design_order_milestones FOR SELECT
  USING (EXISTS (SELECT 1 FROM design_orders dord WHERE dord.id = order_id AND (dord.buyer_id = auth.uid() OR dord.seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))));

CREATE POLICY "Sellers can manage milestones" ON public.design_order_milestones FOR ALL
  USING (EXISTS (SELECT 1 FROM design_orders dord JOIN sellers s ON s.id = dord.seller_id WHERE dord.id = order_id AND s.user_id = auth.uid()));

CREATE POLICY "Users can view their NDA" ON public.design_nda_agreements FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view active templates" ON public.design_service_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Sellers can manage their templates" ON public.design_service_templates FOR ALL
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Team owners can manage members" ON public.design_team_members FOR ALL
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));
CREATE POLICY "Members can view their team" ON public.design_team_members FOR SELECT
  USING (member_user_id = auth.uid());

CREATE POLICY "Team can view internal messages" ON public.design_internal_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM design_team_members tm 
    JOIN design_orders dord ON dord.seller_id = tm.seller_id
    WHERE dord.id = order_id AND tm.member_user_id = auth.uid()
  ));
CREATE POLICY "Team can send internal messages" ON public.design_internal_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM design_team_members tm 
    JOIN design_orders dord ON dord.seller_id = tm.seller_id
    WHERE dord.id = order_id AND tm.member_user_id = auth.uid()
  ));

CREATE POLICY "Sellers can view their own stats" ON public.design_seller_daily_stats FOR SELECT
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can manage their webhooks" ON public.design_webhooks FOR ALL
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can view match profiles" ON public.design_seller_match_profiles FOR SELECT USING (is_available = true);
CREATE POLICY "Sellers can manage their match profile" ON public.design_seller_match_profiles FOR ALL
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can view their subscriptions" ON public.design_seller_subscriptions FOR SELECT
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view audit logs" ON public.design_audit_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can create abuse reports" ON public.design_abuse_reports FOR INSERT WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Admins can manage abuse reports" ON public.design_abuse_reports FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view risk scores" ON public.design_user_risk_scores FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Sellers can view their rewards" ON public.design_seller_rewards FOR SELECT
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Sellers can view their penalties" ON public.design_seller_penalties FOR SELECT
  USING (seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view admin stats" ON public.design_admin_stats FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their email logs" ON public.design_email_logs FOR SELECT
  USING (recipient_user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Users can view revision packages" ON public.design_revision_packages FOR SELECT
  USING (EXISTS (SELECT 1 FROM design_orders dord WHERE dord.id = order_id AND (dord.buyer_id = auth.uid() OR dord.seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))));

CREATE POLICY "Team can view assignments" ON public.design_order_assignments FOR SELECT
  USING (EXISTS (SELECT 1 FROM design_team_members WHERE id = team_member_id AND (member_user_id = auth.uid() OR seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid()))));

CREATE POLICY "Users can view their rate limits" ON public.design_rate_limits FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Sellers can view their webhook logs" ON public.design_webhook_logs FOR SELECT
  USING (webhook_id IN (SELECT id FROM design_webhooks WHERE seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())));

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_order_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_internal_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_seller_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_seller_penalties;
