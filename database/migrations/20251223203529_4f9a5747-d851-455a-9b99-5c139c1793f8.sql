-- Create background_music table for chill music player
CREATE TABLE public.background_music (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  duration_seconds INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.background_music ENABLE ROW LEVEL SECURITY;

-- Public read policy (everyone can listen to music)
CREATE POLICY "Anyone can view active music"
ON public.background_music
FOR SELECT
USING (is_active = true);

-- Admin can manage music (via service role in admin)
CREATE POLICY "Admins can manage music"
ON public.background_music
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_background_music_updated_at
BEFORE UPDATE ON public.background_music
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();