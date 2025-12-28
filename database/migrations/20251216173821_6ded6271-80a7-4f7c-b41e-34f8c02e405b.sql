-- Add policy for anonymous users to read active news
DROP POLICY IF EXISTS "News are viewable by everyone" ON public.news;

CREATE POLICY "News are viewable by everyone" 
ON public.news 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);