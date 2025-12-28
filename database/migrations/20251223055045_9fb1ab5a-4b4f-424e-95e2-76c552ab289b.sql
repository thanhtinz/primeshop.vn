-- Create storage bucket for design service portfolio images
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-services', 'design-services', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view design service images (public bucket)
CREATE POLICY "Anyone can view design service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-services');

-- Allow authenticated users to upload their own design service images
CREATE POLICY "Authenticated users can upload design service images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'design-services' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own design service images
CREATE POLICY "Users can update their own design service images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'design-services' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own design service images
CREATE POLICY "Users can delete their own design service images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'design-services' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);