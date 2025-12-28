
-- Create storage bucket for partners images
INSERT INTO storage.buckets (id, name, public)
VALUES ('partners', 'partners', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public can view partners images"
ON storage.objects FOR SELECT
USING (bucket_id = 'partners');

-- Allow admins to upload/update/delete
CREATE POLICY "Admins can manage partners images"
ON storage.objects FOR ALL
USING (
  bucket_id = 'partners' 
  AND EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE admin_users.user_id = auth.uid()
  )
);
