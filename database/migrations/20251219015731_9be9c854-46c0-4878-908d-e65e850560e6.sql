-- Create storage bucket for avatar frames
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-frames', 'avatar-frames', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Avatar frames are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatar-frames');

-- Allow authenticated users (admins) to upload
CREATE POLICY "Admins can upload avatar frames"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatar-frames');

-- Allow admins to update
CREATE POLICY "Admins can update avatar frames"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatar-frames');

-- Allow admins to delete
CREATE POLICY "Admins can delete avatar frames"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatar-frames');