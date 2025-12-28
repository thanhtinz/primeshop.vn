-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create their own posts" ON public.user_posts;

-- Create a new INSERT policy that handles both personal posts and shop posts
CREATE POLICY "Users can create posts" 
ON public.user_posts 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND (
    -- Personal post (no seller_id)
    seller_id IS NULL 
    OR 
    -- Shop post (seller_id must belong to the user)
    seller_id IN (SELECT id FROM sellers WHERE user_id = auth.uid())
  )
);