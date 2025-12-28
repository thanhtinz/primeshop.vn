-- Add group chat support to chat_rooms
ALTER TABLE public.chat_rooms 
ADD COLUMN IF NOT EXISTS group_name TEXT,
ADD COLUMN IF NOT EXISTS group_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false;

-- Add nickname_for column to track who the nickname is for (member can set nickname for another member)
ALTER TABLE public.chat_room_members
ADD COLUMN IF NOT EXISTS nickname_for_user_id UUID REFERENCES auth.users(id);

-- Create table for member nicknames (each member can set nickname for other members)
CREATE TABLE IF NOT EXISTS public.chat_member_nicknames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  setter_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  nickname TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, setter_user_id, target_user_id)
);

-- Enable RLS
ALTER TABLE public.chat_member_nicknames ENABLE ROW LEVEL SECURITY;

-- RLS policies for member nicknames
CREATE POLICY "Users can view nicknames in their rooms" 
ON public.chat_member_nicknames 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_room_members 
    WHERE room_id = chat_member_nicknames.room_id 
    AND user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = chat_member_nicknames.room_id 
    AND (user_id = auth.uid() OR target_user_id = auth.uid())
  )
);

CREATE POLICY "Users can set nicknames in their rooms" 
ON public.chat_member_nicknames 
FOR INSERT 
WITH CHECK (
  setter_user_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM public.chat_room_members 
      WHERE room_id = chat_member_nicknames.room_id 
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE id = chat_member_nicknames.room_id 
      AND (user_id = auth.uid() OR target_user_id = auth.uid())
    )
  )
);

CREATE POLICY "Users can update their own nicknames" 
ON public.chat_member_nicknames 
FOR UPDATE 
USING (setter_user_id = auth.uid());

CREATE POLICY "Users can delete their own nicknames" 
ON public.chat_member_nicknames 
FOR DELETE 
USING (setter_user_id = auth.uid());

-- Update chat_rooms policies to include group rooms
DROP POLICY IF EXISTS "Users can view their own rooms" ON public.chat_rooms;
CREATE POLICY "Users can view their own rooms" 
ON public.chat_rooms 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR target_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.chat_room_members 
    WHERE room_id = chat_rooms.id 
    AND user_id = auth.uid()
  )
);