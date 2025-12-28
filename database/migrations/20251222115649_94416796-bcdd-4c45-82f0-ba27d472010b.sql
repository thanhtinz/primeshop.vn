-- Create storage bucket for bio avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('bio-avatars', 'bio-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload bio avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bio-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update bio avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'bio-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete bio avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'bio-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to bio avatars
CREATE POLICY "Bio avatars are publicly viewable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'bio-avatars');