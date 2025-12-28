-- Create bucket for group covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-covers', 'group-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload group covers
CREATE POLICY "Anyone can view group covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-covers');

CREATE POLICY "Authenticated users can upload group covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'group-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their group covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'group-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their group covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'group-covers' AND auth.role() = 'authenticated');