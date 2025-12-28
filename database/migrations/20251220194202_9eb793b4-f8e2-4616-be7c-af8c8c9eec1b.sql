-- Allow anyone to view public profiles (for viewing other users' profiles)
CREATE POLICY "Anyone can view public profiles" 
ON public.profiles 
FOR SELECT 
USING (true);