-- Prime Boost pricing settings (admin configurable)
CREATE TABLE public.prime_boost_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    duration_days INTEGER NOT NULL DEFAULT 30,
    price NUMERIC NOT NULL DEFAULT 0,
    discount_percent NUMERIC DEFAULT 0,
    points_multiplier NUMERIC DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prime Boost subscriptions
CREATE TABLE public.prime_boost_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.prime_boost_plans(id),
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    amount_paid NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Name colors shop
CREATE TABLE public.name_colors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    color_value TEXT NOT NULL,
    gradient_value TEXT,
    is_gradient BOOLEAN DEFAULT false,
    price NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User purchased name colors
CREATE TABLE public.user_name_colors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    color_id UUID NOT NULL REFERENCES public.name_colors(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, color_id)
);

-- Prime Boost effects (particles, glow, etc.)
CREATE TABLE public.prime_effects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_en TEXT,
    effect_type TEXT NOT NULL, -- 'particles', 'glow', 'border'
    effect_config JSONB DEFAULT '{}',
    price NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User purchased effects
CREATE TABLE public.user_prime_effects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    effect_id UUID NOT NULL REFERENCES public.prime_effects(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, effect_id)
);

-- Prime Boost additional benefits configuration
CREATE TABLE public.prime_boost_benefits (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    benefit_key TEXT NOT NULL UNIQUE,
    benefit_name TEXT NOT NULL,
    benefit_name_en TEXT,
    benefit_value TEXT,
    is_enabled BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prime_boost_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prime_boost_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.name_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_name_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prime_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_prime_effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prime_boost_benefits ENABLE ROW LEVEL SECURITY;

-- RLS policies for prime_boost_plans (public read, admin write)
CREATE POLICY "Anyone can view active prime boost plans"
ON public.prime_boost_plans FOR SELECT
USING (is_active = true);

-- RLS policies for prime_boost_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.prime_boost_subscriptions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
ON public.prime_boost_subscriptions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS policies for name_colors (public read)
CREATE POLICY "Anyone can view active name colors"
ON public.name_colors FOR SELECT
USING (is_active = true);

-- RLS policies for user_name_colors
CREATE POLICY "Users can view their own name colors"
ON public.user_name_colors FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own name colors"
ON public.user_name_colors FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own name colors"
ON public.user_name_colors FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS policies for prime_effects (public read)
CREATE POLICY "Anyone can view active prime effects"
ON public.prime_effects FOR SELECT
USING (is_active = true);

-- RLS policies for user_prime_effects
CREATE POLICY "Users can view their own effects"
ON public.user_prime_effects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own effects"
ON public.user_prime_effects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own effects"
ON public.user_prime_effects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS policies for prime_boost_benefits (public read)
CREATE POLICY "Anyone can view enabled benefits"
ON public.prime_boost_benefits FOR SELECT
USING (is_enabled = true);

-- Add has_prime_boost column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_prime_boost BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS prime_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_name_color_id UUID REFERENCES public.name_colors(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_effect_id UUID REFERENCES public.prime_effects(id);

-- Insert default plans
INSERT INTO public.prime_boost_plans (name, name_en, duration_days, price, discount_percent, points_multiplier, sort_order) VALUES
('Prime Boost 1 Tháng', 'Prime Boost 1 Month', 30, 99000, 0, 1.5, 1),
('Prime Boost 3 Tháng', 'Prime Boost 3 Months', 90, 249000, 15, 1.5, 2),
('Prime Boost 1 Năm', 'Prime Boost 1 Year', 365, 799000, 30, 2, 3);

-- Insert default name colors
INSERT INTO public.name_colors (name, name_en, color_value, is_gradient, gradient_value, price, sort_order) VALUES
('Đỏ Ruby', 'Ruby Red', '#ef4444', false, NULL, 29000, 1),
('Xanh Sapphire', 'Sapphire Blue', '#3b82f6', false, NULL, 29000, 2),
('Tím Amethyst', 'Amethyst Purple', '#8b5cf6', false, NULL, 29000, 3),
('Vàng Gold', 'Gold', '#eab308', false, NULL, 39000, 4),
('Cầu vồng', 'Rainbow', '#ff0000', true, 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)', 59000, 5),
('Hồng Neon', 'Neon Pink', '#f472b6', false, NULL, 29000, 6),
('Xanh Ngọc', 'Emerald', '#10b981', false, NULL, 29000, 7);

-- Insert default effects
INSERT INTO public.prime_effects (name, name_en, effect_type, effect_config, price, sort_order) VALUES
('Ánh sáng vàng', 'Golden Glow', 'glow', '{"color": "#fbbf24", "blur": "20px"}', 49000, 1),
('Viền cầu vồng', 'Rainbow Border', 'border', '{"gradient": "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #9400d3)"}', 69000, 2),
('Particles Lửa', 'Fire Particles', 'particles', '{"type": "fire", "color": "#ef4444"}', 79000, 3),
('Particles Tuyết', 'Snow Particles', 'particles', '{"type": "snow", "color": "#ffffff"}', 59000, 4);

-- Insert default benefits
INSERT INTO public.prime_boost_benefits (benefit_key, benefit_name, benefit_name_en, benefit_value, sort_order) VALUES
('gif_avatar', 'Avatar động (GIF)', 'Animated Avatar (GIF)', 'true', 1),
('gif_banner', 'Banner động (GIF)', 'Animated Banner (GIF)', 'true', 2),
('prime_badge', 'Badge Prime', 'Prime Badge', 'true', 3),
('discount_purchase', 'Giảm giá mua hàng', 'Purchase Discount', '5', 4),
('points_multiplier', 'Nhân điểm thưởng', 'Points Multiplier', '1.5', 5),
('priority_support', 'Hỗ trợ ưu tiên', 'Priority Support', 'true', 6);