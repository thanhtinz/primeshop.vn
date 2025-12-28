-- Daily Check-in Settings (Admin)
CREATE TABLE public.daily_checkin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT true,
  base_points INTEGER DEFAULT 10,
  streak_bonus_multiplier NUMERIC(3,2) DEFAULT 1.5,
  max_streak_bonus INTEGER DEFAULT 100,
  streak_milestones JSONB DEFAULT '[{"day": 7, "bonus": 50}, {"day": 14, "bonus": 100}, {"day": 30, "bonus": 200}]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily Check-in Records
CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 1,
  is_milestone_bonus BOOLEAN DEFAULT false,
  milestone_bonus_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- User Points Balance
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Points Transactions
CREATE TABLE public.point_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL, -- 'earn', 'spend', 'refund'
  source TEXT NOT NULL, -- 'checkin', 'achievement', 'purchase', 'referral', 'redeem'
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Points Redemption Items (Admin configures vouchers/gifts)
CREATE TABLE public.points_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  reward_type TEXT NOT NULL DEFAULT 'voucher', -- 'voucher', 'gift', 'balance'
  points_cost INTEGER NOT NULL,
  reward_value NUMERIC(10,2), -- voucher amount or balance
  voucher_discount_percent INTEGER,
  quantity_limit INTEGER,
  quantity_redeemed INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Redemption History
CREATE TABLE public.points_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES public.points_rewards(id),
  points_spent INTEGER NOT NULL,
  voucher_code TEXT,
  status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Achievements/Badges Definition
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE, -- 'first_purchase', 'top_buyer', 'reviewer', 'referrer', 'vip_member'
  name TEXT NOT NULL,
  name_en TEXT,
  description TEXT,
  description_en TEXT,
  icon TEXT, -- lucide icon name
  badge_color TEXT DEFAULT '#FFD700',
  points_reward INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL, -- 'purchase_count', 'review_count', 'referral_count', 'total_spent', 'vip_level', 'checkin_streak'
  requirement_value INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_displayed BOOLEAN DEFAULT true,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.daily_checkin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_checkin_settings (public read, admin write)
CREATE POLICY "Anyone can view checkin settings" ON public.daily_checkin_settings FOR SELECT USING (true);

-- RLS Policies for daily_checkins
CREATE POLICY "Users can view their own checkins" ON public.daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own checkins" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_points
CREATE POLICY "Users can view their own points" ON public.user_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own points record" ON public.user_points FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own points" ON public.user_points FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for point_transactions
CREATE POLICY "Users can view their own transactions" ON public.point_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own transactions" ON public.point_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for points_rewards (public read)
CREATE POLICY "Anyone can view active rewards" ON public.points_rewards FOR SELECT USING (is_active = true);

-- RLS Policies for points_redemptions
CREATE POLICY "Users can view their own redemptions" ON public.points_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own redemptions" ON public.points_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view active achievements" ON public.achievements FOR SELECT USING (is_active = true);

-- RLS Policies for user_achievements
CREATE POLICY "Anyone can view user achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can create their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON public.user_achievements FOR UPDATE USING (auth.uid() = user_id);

-- Insert default checkin settings
INSERT INTO public.daily_checkin_settings (is_enabled, base_points, streak_bonus_multiplier, max_streak_bonus)
VALUES (true, 10, 1.5, 100);

-- Insert default achievements
INSERT INTO public.achievements (code, name, name_en, description, description_en, icon, badge_color, points_reward, requirement_type, requirement_value, sort_order)
VALUES 
  ('first_purchase', 'Khách hàng mới', 'First Purchase', 'Hoàn thành đơn hàng đầu tiên', 'Complete your first order', 'ShoppingBag', '#4CAF50', 50, 'purchase_count', 1, 1),
  ('reviewer', 'Người đánh giá', 'Reviewer', 'Đánh giá 5 sản phẩm', 'Review 5 products', 'Star', '#FF9800', 100, 'review_count', 5, 2),
  ('top_buyer', 'Người mua hàng', 'Top Buyer', 'Chi tiêu trên 1.000.000đ', 'Spend over 1,000,000đ', 'Crown', '#FFD700', 200, 'total_spent', 1000000, 3),
  ('referrer', 'Người giới thiệu', 'Referrer', 'Giới thiệu 3 người bạn', 'Refer 3 friends', 'Users', '#2196F3', 150, 'referral_count', 3, 4),
  ('vip_member', 'Thành viên VIP', 'VIP Member', 'Đạt cấp VIP', 'Reach VIP level', 'Award', '#9C27B0', 300, 'vip_level', 1, 5),
  ('streak_master', 'Điểm danh liên tục', 'Streak Master', 'Điểm danh 30 ngày liên tục', '30 days check-in streak', 'Flame', '#F44336', 500, 'checkin_streak', 30, 6);

-- Create update timestamp trigger
CREATE TRIGGER update_daily_checkin_settings_updated_at
BEFORE UPDATE ON public.daily_checkin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_points_rewards_updated_at
BEFORE UPDATE ON public.points_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at
BEFORE UPDATE ON public.achievements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();