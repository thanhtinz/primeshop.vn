-- Add DELETE policy for chat_messages
CREATE POLICY "Users can delete messages in their rooms"
ON public.chat_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = chat_messages.room_id
    AND chat_rooms.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

-- Add DELETE policy for chat_rooms
CREATE POLICY "Users can delete their own chat rooms"
ON public.chat_rooms
FOR DELETE
USING (auth.uid() = user_id);