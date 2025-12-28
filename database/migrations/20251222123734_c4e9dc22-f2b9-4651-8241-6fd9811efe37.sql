-- Drop existing policy and recreate with proper WITH CHECK
DROP POLICY IF EXISTS "Users can manage their own links" ON public.bio_links;

-- Create separate policies for each operation with proper WITH CHECK
CREATE POLICY "Users can select their own links"
ON public.bio_links
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM bio_profiles 
  WHERE bio_profiles.id = bio_links.profile_id 
  AND bio_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own links"
ON public.bio_links
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM bio_profiles 
  WHERE bio_profiles.id = profile_id 
  AND bio_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update their own links"
ON public.bio_links
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM bio_profiles 
  WHERE bio_profiles.id = bio_links.profile_id 
  AND bio_profiles.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM bio_profiles 
  WHERE bio_profiles.id = bio_links.profile_id 
  AND bio_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own links"
ON public.bio_links
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM bio_profiles 
  WHERE bio_profiles.id = bio_links.profile_id 
  AND bio_profiles.user_id = auth.uid()
));