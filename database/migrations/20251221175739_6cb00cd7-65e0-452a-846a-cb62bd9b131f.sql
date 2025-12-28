-- Add UPDATE policy for group_post_likes to allow users to change their reaction
CREATE POLICY "Users can update their own reactions" 
ON public.group_post_likes 
FOR UPDATE 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());