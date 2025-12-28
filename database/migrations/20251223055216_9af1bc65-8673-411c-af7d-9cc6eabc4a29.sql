-- Create storage bucket for design portfolio images (correct bucket name)
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-portfolios', 'design-portfolios', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view design portfolio images (public bucket)
CREATE POLICY "Anyone can view design portfolio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-portfolios');

-- Allow authenticated users to upload their own design portfolio images
CREATE POLICY "Authenticated users can upload design portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'design-portfolios' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own design portfolio images
CREATE POLICY "Users can update their own design portfolio images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'design-portfolios' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own design portfolio images
CREATE POLICY "Users can delete their own design portfolio images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'design-portfolios' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);