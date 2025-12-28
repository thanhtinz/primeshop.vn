-- Add target_user_id for user-to-user chat (null = admin chat)
ALTER TABLE public.chat_rooms 
  ADD COLUMN IF NOT EXISTS target_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS room_type text DEFAULT 'admin' CHECK (room_type IN ('admin', 'user'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_target_user ON public.chat_rooms(target_user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_room_type ON public.chat_rooms(room_type);

-- Update sender_type constraint to allow 'user' sender in user-to-user chat
ALTER TABLE public.chat_messages 
  DROP CONSTRAINT IF EXISTS chat_messages_sender_type_check;

-- Add comment for clarity
COMMENT ON COLUMN public.chat_rooms.target_user_id IS 'Target user for user-to-user chat (null for admin chat)';
COMMENT ON COLUMN public.chat_rooms.room_type IS 'Type of chat room: admin or user';