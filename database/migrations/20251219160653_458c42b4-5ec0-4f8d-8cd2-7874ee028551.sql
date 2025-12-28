-- Create sticker_packs table
CREATE TABLE public.sticker_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stickers table
CREATE TABLE public.stickers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.sticker_packs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sticker_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stickers ENABLE ROW LEVEL SECURITY;

-- Public read access for stickers (everyone can see stickers)
CREATE POLICY "Sticker packs are viewable by everyone" 
ON public.sticker_packs 
FOR SELECT 
USING (true);

CREATE POLICY "Stickers are viewable by everyone" 
ON public.stickers 
FOR SELECT 
USING (true);

-- Admin write access (using admin_users table)
CREATE POLICY "Admins can manage sticker packs" 
ON public.sticker_packs 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage stickers" 
ON public.stickers 
FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
);

-- Create indexes
CREATE INDEX idx_stickers_pack_id ON public.stickers(pack_id);
CREATE INDEX idx_sticker_packs_active ON public.sticker_packs(is_active, sort_order);
CREATE INDEX idx_stickers_active ON public.stickers(is_active, sort_order);