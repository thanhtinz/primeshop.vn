-- Bảng bio profiles (link-in-bio của user)
CREATE TABLE public.bio_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  
  -- Theme settings
  theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'auto')),
  background_type TEXT DEFAULT 'solid' CHECK (background_type IN ('solid', 'gradient', 'image')),
  background_color TEXT DEFAULT '#ffffff',
  background_gradient TEXT,
  background_image_url TEXT,
  text_color TEXT DEFAULT '#000000',
  button_style TEXT DEFAULT 'rounded' CHECK (button_style IN ('rounded', 'pill', 'square', 'outline')),
  button_color TEXT DEFAULT '#3b82f6',
  button_text_color TEXT DEFAULT '#ffffff',
  font_family TEXT DEFAULT 'Inter',
  
  -- Plan & limits
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  plan_expires_at TIMESTAMPTZ,
  
  -- Privacy
  is_public BOOLEAN DEFAULT true,
  password_hash TEXT,
  
  -- Stats
  total_views INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index cho username lookup
CREATE INDEX idx_bio_profiles_username ON public.bio_profiles(username);
CREATE INDEX idx_bio_profiles_user_id ON public.bio_profiles(user_id);

-- Bảng bio links
CREATE TABLE public.bio_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.bio_profiles(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  thumbnail_url TEXT,
  badge TEXT CHECK (badge IN ('new', 'hot', 'sale', 'popular', NULL)),
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  open_in_new_tab BOOLEAN DEFAULT true,
  
  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Stats
  click_count INTEGER DEFAULT 0,
  
  -- Order
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bio_links_profile_id ON public.bio_links(profile_id);

-- Bảng content blocks (text, image, video, social icons)
CREATE TABLE public.bio_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.bio_profiles(id) ON DELETE CASCADE,
  
  block_type TEXT NOT NULL CHECK (block_type IN ('text', 'image', 'video', 'social_icons', 'divider', 'contact_form', 'shop')),
  
  -- Content based on type
  content JSONB DEFAULT '{}',
  -- text: { text: string }
  -- image: { url: string, alt: string, link: string }
  -- video: { url: string, platform: 'youtube' | 'tiktok' | 'vimeo' }
  -- social_icons: { icons: [{ platform: string, url: string }] }
  -- contact_form: { email: string, fields: [] }
  -- shop: { products: [] }
  
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bio_blocks_profile_id ON public.bio_blocks(profile_id);

-- Bảng analytics chi tiết
CREATE TABLE public.bio_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.bio_profiles(id) ON DELETE CASCADE,
  link_id UUID REFERENCES public.bio_links(id) ON DELETE SET NULL,
  
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'qr_scan')),
  
  -- Tracking data
  referrer TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bio_analytics_profile_id ON public.bio_analytics(profile_id);
CREATE INDEX idx_bio_analytics_created_at ON public.bio_analytics(created_at);
CREATE INDEX idx_bio_analytics_event_type ON public.bio_analytics(event_type);

-- Bảng QR codes
CREATE TABLE public.bio_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.bio_profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  qr_type TEXT DEFAULT 'static' CHECK (qr_type IN ('static', 'dynamic')),
  target_url TEXT NOT NULL,
  
  -- Styling
  dot_color TEXT DEFAULT '#000000',
  background_color TEXT DEFAULT '#ffffff',
  logo_url TEXT,
  
  -- Stats
  scan_count INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bio_qr_codes_profile_id ON public.bio_qr_codes(profile_id);

-- Bảng subscription/payment cho Bio Pro
CREATE TABLE public.bio_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.bio_profiles(id) ON DELETE SET NULL,
  
  plan TEXT NOT NULL CHECK (plan IN ('pro_monthly', 'pro_yearly')),
  amount INTEGER NOT NULL,
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  -- Auto renewal
  auto_renew BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bio_subscriptions_user_id ON public.bio_subscriptions(user_id);
CREATE INDEX idx_bio_subscriptions_expires_at ON public.bio_subscriptions(expires_at);

-- Bảng templates
CREATE TABLE public.bio_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name TEXT NOT NULL,
  description TEXT,
  preview_image_url TEXT,
  
  -- Template data
  theme_data JSONB NOT NULL DEFAULT '{}',
  is_pro_only BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bio_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies cho bio_profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.bio_profiles FOR SELECT
USING (is_public = true AND is_active = true);

CREATE POLICY "Users can view their own profiles"
ON public.bio_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profiles"
ON public.bio_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
ON public.bio_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
ON public.bio_profiles FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies cho bio_links
CREATE POLICY "Links are viewable on public profiles"
ON public.bio_links FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bio_profiles 
    WHERE id = profile_id AND (is_public = true OR user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage their own links"
ON public.bio_links FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.bio_profiles 
    WHERE id = profile_id AND user_id = auth.uid()
  )
);

-- RLS Policies cho bio_blocks
CREATE POLICY "Blocks are viewable on public profiles"
ON public.bio_blocks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bio_profiles 
    WHERE id = profile_id AND (is_public = true OR user_id = auth.uid())
  )
);

CREATE POLICY "Users can manage their own blocks"
ON public.bio_blocks FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.bio_profiles 
    WHERE id = profile_id AND user_id = auth.uid()
  )
);

-- RLS Policies cho bio_analytics (only owner can view)
CREATE POLICY "Users can view their own analytics"
ON public.bio_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bio_profiles 
    WHERE id = profile_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert analytics"
ON public.bio_analytics FOR INSERT
WITH CHECK (true);

-- RLS Policies cho bio_qr_codes
CREATE POLICY "QR codes are viewable by profile owner"
ON public.bio_qr_codes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bio_profiles 
    WHERE id = profile_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own QR codes"
ON public.bio_qr_codes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.bio_profiles 
    WHERE id = profile_id AND user_id = auth.uid()
  )
);

-- RLS Policies cho bio_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.bio_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
ON public.bio_subscriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies cho bio_templates (public read)
CREATE POLICY "Templates are viewable by everyone"
ON public.bio_templates FOR SELECT
USING (is_active = true);

-- Function cập nhật updated_at
CREATE OR REPLACE FUNCTION public.update_bio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers cho updated_at
CREATE TRIGGER update_bio_profiles_updated_at
BEFORE UPDATE ON public.bio_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_bio_updated_at();

CREATE TRIGGER update_bio_links_updated_at
BEFORE UPDATE ON public.bio_links
FOR EACH ROW EXECUTE FUNCTION public.update_bio_updated_at();

CREATE TRIGGER update_bio_blocks_updated_at
BEFORE UPDATE ON public.bio_blocks
FOR EACH ROW EXECUTE FUNCTION public.update_bio_updated_at();

CREATE TRIGGER update_bio_qr_codes_updated_at
BEFORE UPDATE ON public.bio_qr_codes
FOR EACH ROW EXECUTE FUNCTION public.update_bio_updated_at();

CREATE TRIGGER update_bio_subscriptions_updated_at
BEFORE UPDATE ON public.bio_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_bio_updated_at();