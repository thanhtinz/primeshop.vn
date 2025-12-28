-- Create storage bucket for background music files
INSERT INTO storage.buckets (id, name, public)
VALUES ('background-music', 'background-music', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to background music files
CREATE POLICY "Public read access for background music"
ON storage.objects FOR SELECT
USING (bucket_id = 'background-music');

-- Allow authenticated users to upload music files (admin only in practice)
CREATE POLICY "Authenticated users can upload background music"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'background-music' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update background music"
ON storage.objects FOR UPDATE
USING (bucket_id = 'background-music' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete music files
CREATE POLICY "Authenticated users can delete background music"
ON storage.objects FOR DELETE
USING (bucket_id = 'background-music' AND auth.role() = 'authenticated');