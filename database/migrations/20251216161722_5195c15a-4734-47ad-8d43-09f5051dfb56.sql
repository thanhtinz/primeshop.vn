-- Login history table for security tracking
CREATE TABLE public.login_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  location TEXT,
  login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_suspicious BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own login history
CREATE POLICY "Users can view own login history" 
ON public.login_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all login history
CREATE POLICY "Admins can view all login history" 
ON public.login_history 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Allow insert for login tracking (from edge function)
CREATE POLICY "Login history can be inserted" 
ON public.login_history 
FOR INSERT 
WITH CHECK (true);

-- Avatar frames table (purchasable with balance)
CREATE TABLE public.avatar_frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avatar_frames ENABLE ROW LEVEL SECURITY;

-- Avatar frames are publicly readable (active ones)
CREATE POLICY "Avatar frames are publicly readable" 
ON public.avatar_frames 
FOR SELECT 
USING (is_active = true);

-- Admins can manage avatar frames
CREATE POLICY "Admins can manage avatar frames" 
ON public.avatar_frames 
FOR ALL 
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- User purchased frames table
CREATE TABLE public.user_avatar_frames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  frame_id UUID NOT NULL REFERENCES public.avatar_frames(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, frame_id)
);

-- Enable RLS
ALTER TABLE public.user_avatar_frames ENABLE ROW LEVEL SECURITY;

-- Users can view their own frames
CREATE POLICY "Users can view own frames" 
ON public.user_avatar_frames 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can purchase frames
CREATE POLICY "Users can purchase frames" 
ON public.user_avatar_frames 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add avatar, banner, and frame to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_frame_id UUID REFERENCES public.avatar_frames(id),
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS login_notification_enabled BOOLEAN DEFAULT true;

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars', 'user-avatars', true) ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for user banners
INSERT INTO storage.buckets (id, name, public) VALUES ('user-banners', 'user-banners', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for user avatars
CREATE POLICY "Anyone can view user avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for user banners
CREATE POLICY "Anyone can view user banners" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-banners');

CREATE POLICY "Users can upload their own banner" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own banner" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-banners' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own banner" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-banners' AND auth.uid()::text = (storage.foldername(name))[1]);