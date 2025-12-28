-- Story Reactions table
CREATE TABLE IF NOT EXISTS public.story_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint: one reaction per user per story
ALTER TABLE public.story_reactions ADD CONSTRAINT unique_story_reaction UNIQUE (story_id, user_id);

-- Enable RLS
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_reactions
CREATE POLICY "Users can view all reactions" ON public.story_reactions FOR SELECT USING (true);
CREATE POLICY "Users can create their own reactions" ON public.story_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reactions" ON public.story_reactions FOR DELETE USING (auth.uid() = user_id);

-- Online Status tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Typing indicators (realtime presence, no table needed - just use Supabase Realtime)
-- Chat read status - add read_at timestamp to track when messages were read
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_story_reactions_story_id ON public.story_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read_at ON public.chat_messages(read_at);

-- Enable realtime for story_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;