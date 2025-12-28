-- Add columns for chat room customization
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS background_theme TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS quick_reaction_emoji TEXT DEFAULT '👍',
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Create chat room members table for group chat
CREATE TABLE IF NOT EXISTS public.chat_room_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  nickname TEXT,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS
ALTER TABLE public.chat_room_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_room_members
CREATE POLICY "Users can view members in their rooms"
ON public.chat_room_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = chat_room_members.room_id
    AND (chat_rooms.user_id = auth.uid() OR is_admin(auth.uid()))
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Room owners can add members"
ON public.chat_room_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = chat_room_members.room_id
    AND chat_rooms.user_id = auth.uid()
  )
);

CREATE POLICY "Room owners can remove members"
ON public.chat_room_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = chat_room_members.room_id
    AND chat_rooms.user_id = auth.uid()
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Members can update their own nickname"
ON public.chat_room_members
FOR UPDATE
USING (user_id = auth.uid());