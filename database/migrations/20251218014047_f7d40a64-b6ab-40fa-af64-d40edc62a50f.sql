-- Create smm_platforms table (Nền tảng: Facebook, Instagram, TikTok, etc.)
CREATE TABLE public.smm_platforms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create smm_service_types table (Dịch vụ: Like, Follow, Comment, etc.)
CREATE TABLE public.smm_service_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_id UUID NOT NULL REFERENCES public.smm_platforms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add service_type_id to smm_services (now represents packages)
ALTER TABLE public.smm_services 
ADD COLUMN service_type_id UUID REFERENCES public.smm_service_types(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.smm_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smm_service_types ENABLE ROW LEVEL SECURITY;

-- RLS policies for smm_platforms
CREATE POLICY "SMM platforms are publicly readable" 
ON public.smm_platforms FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage SMM platforms" 
ON public.smm_platforms FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- RLS policies for smm_service_types
CREATE POLICY "SMM service types are publicly readable" 
ON public.smm_service_types FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage SMM service types" 
ON public.smm_service_types FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Insert default platforms
INSERT INTO public.smm_platforms (name, slug, sort_order) VALUES
('Facebook', 'facebook', 1),
('Instagram', 'instagram', 2),
('TikTok', 'tiktok', 3),
('YouTube', 'youtube', 4),
('Twitter/X', 'twitter', 5),
('Telegram', 'telegram', 6),
('Discord', 'discord', 7),
('Spotify', 'spotify', 8);

-- Create indexes
CREATE INDEX idx_smm_service_types_platform ON public.smm_service_types(platform_id);
CREATE INDEX idx_smm_services_service_type ON public.smm_services(service_type_id);