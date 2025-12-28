-- Stories table (24h expiry)
CREATE TABLE public.user_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' or 'video'
  caption TEXT,
  background_color TEXT,
  text_content TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Story views tracking
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Story reactions
CREATE TABLE public.story_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, user_id)
);

-- Notes table (like Facebook notes)
CREATE TABLE public.user_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  background_style TEXT DEFAULT 'gradient-1',
  music_url TEXT,
  music_name TEXT,
  is_pinned BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours')
);

-- Note reactions
CREATE TABLE public.note_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.user_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(note_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_reactions ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Anyone can view non-expired stories" ON public.user_stories
FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can create their own stories" ON public.user_stories
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON public.user_stories
FOR DELETE USING (auth.uid() = user_id);

-- Story views policies
CREATE POLICY "Story owners can view who viewed" ON public.story_views
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_stories WHERE id = story_id AND user_id = auth.uid())
  OR viewer_id = auth.uid()
);

CREATE POLICY "Anyone can add view" ON public.story_views
FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Story reactions policies
CREATE POLICY "Anyone can view reactions" ON public.story_reactions
FOR SELECT USING (true);

CREATE POLICY "Users can add reactions" ON public.story_reactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions" ON public.story_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Anyone can view non-expired notes" ON public.user_notes
FOR SELECT USING (expires_at IS NULL OR expires_at > now());

CREATE POLICY "Users can create their own notes" ON public.user_notes
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON public.user_notes
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON public.user_notes
FOR DELETE USING (auth.uid() = user_id);

-- Note reactions policies
CREATE POLICY "Anyone can view note reactions" ON public.note_reactions
FOR SELECT USING (true);

CREATE POLICY "Users can add note reactions" ON public.note_reactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their note reactions" ON public.note_reactions
FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for stories and notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notes;