-- =====================================================
-- DESIGN SYSTEM ADVANCED FEATURES MIGRATION
-- =====================================================

-- 1. Design File Versions Table (Versioning)
CREATE TABLE IF NOT EXISTS public.design_file_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.design_tickets(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.design_orders(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  thumbnail_url TEXT,
  notes TEXT,
  uploaded_by UUID NOT NULL,
  is_final BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Design Multi-Criteria Reviews Table
CREATE TABLE IF NOT EXISTS public.design_review_criteria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.design_orders(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.design_services(id),
  seller_id UUID NOT NULL REFERENCES public.sellers(id),
  buyer_id UUID NOT NULL,
  overall_rating INT NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5),
  deadline_rating INT CHECK (deadline_rating >= 1 AND deadline_rating <= 5),
  quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5),
  comment TEXT,
  is_on_time BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, buyer_id)
);

-- 3. Seller Notes (Private notes for sellers)
CREATE TABLE IF NOT EXISTS public.design_seller_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.design_tickets(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.sellers(id),
  note TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Activity Logs for Design System
CREATE TABLE IF NOT EXISTS public.design_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.design_tickets(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.design_orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'buyer',
  action TEXT NOT NULL,
  action_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Report System
CREATE TABLE IF NOT EXISTS public.design_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES public.design_tickets(id),
  order_id UUID REFERENCES public.design_orders(id),
  reporter_id UUID NOT NULL,
  reporter_type TEXT NOT NULL DEFAULT 'buyer',
  reported_user_id UUID NOT NULL,
  reported_user_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  evidence_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Seller Availability Status
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available';
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS availability_reason TEXT;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS availability_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS max_concurrent_orders INT DEFAULT 5;
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS current_active_orders INT DEFAULT 0;

-- 7. Ticket Priority & Auto-close fields
ALTER TABLE public.design_tickets ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;
ALTER TABLE public.design_tickets ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE public.design_tickets ADD COLUMN IF NOT EXISTS buyer_last_response_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.design_tickets ADD COLUMN IF NOT EXISTS seller_last_response_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.design_tickets ADD COLUMN IF NOT EXISTS auto_close_warning_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE public.design_tickets ADD COLUMN IF NOT EXISTS auto_close_at TIMESTAMP WITH TIME ZONE;

-- 8. File Validation Settings per Service
ALTER TABLE public.design_services ADD COLUMN IF NOT EXISTS max_file_size_mb INT DEFAULT 50;
ALTER TABLE public.design_services ADD COLUMN IF NOT EXISTS allowed_file_formats TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'pdf', 'ai', 'psd'];
ALTER TABLE public.design_services ADD COLUMN IF NOT EXISTS min_resolution_width INT;
ALTER TABLE public.design_services ADD COLUMN IF NOT EXISTS min_resolution_height INT;

-- 9. Quick Action Templates
CREATE TABLE IF NOT EXISTS public.design_quick_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type TEXT NOT NULL,
  label TEXT NOT NULL,
  label_en TEXT,
  message_template TEXT,
  icon TEXT,
  color TEXT,
  sort_order INT DEFAULT 0,
  is_for_buyer BOOLEAN DEFAULT TRUE,
  is_for_seller BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Blocked Keywords for External Communication
CREATE TABLE IF NOT EXISTS public.design_blocked_keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_pattern TEXT NOT NULL,
  keyword_type TEXT DEFAULT 'phone',
  replacement_text TEXT DEFAULT '[đã ẩn]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Add reminder tracking to orders
ALTER TABLE public.design_orders ADD COLUMN IF NOT EXISTS seller_deadline_reminded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.design_orders ADD COLUMN IF NOT EXISTS seller_overdue_reminded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.design_orders ADD COLUMN IF NOT EXISTS buyer_no_response_reminded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.design_orders ADD COLUMN IF NOT EXISTS buyer_confirm_reminded_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.design_file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_review_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_seller_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_quick_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.design_blocked_keywords ENABLE ROW LEVEL SECURITY;

-- RLS Policies for design_file_versions
CREATE POLICY "Users can view versions of their orders" ON public.design_file_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.design_orders o
      WHERE o.id = design_file_versions.order_id
      AND (o.buyer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.sellers s WHERE s.id = o.seller_id AND s.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Sellers can insert versions" ON public.design_file_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.design_orders o
      JOIN public.sellers s ON s.id = o.seller_id
      WHERE o.id = design_file_versions.order_id AND s.user_id = auth.uid()
    )
  );

-- RLS Policies for design_review_criteria
CREATE POLICY "Anyone can view reviews" ON public.design_review_criteria
  FOR SELECT USING (true);

CREATE POLICY "Buyers can create reviews" ON public.design_review_criteria
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for design_seller_notes
CREATE POLICY "Sellers can manage their notes" ON public.design_seller_notes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.sellers s WHERE s.id = design_seller_notes.seller_id AND s.user_id = auth.uid())
  );

-- RLS Policies for design_activity_logs
CREATE POLICY "Users can view activity logs of their orders" ON public.design_activity_logs
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.design_orders o
      WHERE o.id = design_activity_logs.order_id
      AND (o.buyer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.sellers s WHERE s.id = o.seller_id AND s.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can insert activity logs" ON public.design_activity_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for design_reports
CREATE POLICY "Users can create reports" ON public.design_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view their reports" ON public.design_reports
  FOR SELECT USING (reporter_id = auth.uid() OR reported_user_id = auth.uid());

-- RLS Policies for quick actions (public read)
CREATE POLICY "Anyone can view quick actions" ON public.design_quick_actions
  FOR SELECT USING (is_active = true);

-- RLS for blocked keywords (public read)
CREATE POLICY "Anyone can view blocked keywords" ON public.design_blocked_keywords
  FOR SELECT USING (is_active = true);

-- Insert default quick actions
INSERT INTO public.design_quick_actions (action_type, label, label_en, message_template, icon, color, is_for_buyer, is_for_seller, sort_order) VALUES
('request_revision', 'Yêu cầu chỉnh sửa', 'Request Revision', '🔄 Tôi muốn yêu cầu chỉnh sửa:', 'RefreshCw', 'orange', true, false, 1),
('approve_draft', 'Đồng ý bản nháp', 'Approve Draft', '✅ Tôi đồng ý với bản thiết kế này.', 'CheckCircle', 'green', true, false, 2),
('not_satisfied', 'Không hài lòng', 'Not Satisfied', '😕 Tôi chưa hài lòng vì:', 'XCircle', 'red', true, false, 3),
('accept_now', 'Chấp nhận luôn', 'Accept Now', '🎉 Hoàn hảo! Tôi chấp nhận luôn và bỏ qua các lượt chỉnh sửa còn lại.', 'Sparkles', 'purple', true, false, 4),
('delivering', 'Đang gửi file', 'Delivering', '📦 Tôi đang gửi file thiết kế cho bạn.', 'Package', 'blue', false, true, 1),
('need_more_info', 'Cần thêm thông tin', 'Need More Info', '❓ Tôi cần thêm thông tin về:', 'HelpCircle', 'yellow', false, true, 2),
('working_on_it', 'Đang thực hiện', 'Working On It', '⚙️ Tôi đang làm việc với yêu cầu của bạn.', 'Loader', 'blue', false, true, 3)
ON CONFLICT DO NOTHING;

-- Insert default blocked keywords
INSERT INTO public.design_blocked_keywords (keyword_pattern, keyword_type, replacement_text) VALUES
('0\d{9,10}', 'phone', '[số điện thoại đã ẩn]'),
('(zalo|viber|telegram|whatsapp)[:\s]*\d+', 'messenger', '[liên hệ ngoài đã ẩn]'),
('(facebook|fb|messenger)\.com/\S+', 'social', '[link đã ẩn]'),
('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', 'email', '[email đã ẩn]')
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_design_file_versions_ticket ON public.design_file_versions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_design_file_versions_order ON public.design_file_versions(order_id);
CREATE INDEX IF NOT EXISTS idx_design_review_criteria_seller ON public.design_review_criteria(seller_id);
CREATE INDEX IF NOT EXISTS idx_design_review_criteria_service ON public.design_review_criteria(service_id);
CREATE INDEX IF NOT EXISTS idx_design_seller_notes_ticket ON public.design_seller_notes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_design_activity_logs_ticket ON public.design_activity_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_design_activity_logs_order ON public.design_activity_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_design_reports_status ON public.design_reports(status);
CREATE INDEX IF NOT EXISTS idx_sellers_availability ON public.sellers(availability_status);
CREATE INDEX IF NOT EXISTS idx_design_tickets_priority ON public.design_tickets(priority DESC);
CREATE INDEX IF NOT EXISTS idx_design_tickets_auto_close ON public.design_tickets(auto_close_at) WHERE auto_close_at IS NOT NULL;

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_file_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_activity_logs;