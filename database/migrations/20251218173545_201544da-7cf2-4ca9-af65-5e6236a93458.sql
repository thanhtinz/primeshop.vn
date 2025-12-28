-- Add images column to seller_reviews table
ALTER TABLE public.seller_reviews 
ADD COLUMN images text[] DEFAULT '{}';

-- Create storage bucket for seller review images if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('seller-reviews', 'seller-reviews', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for uploading
CREATE POLICY "Authenticated users can upload seller review images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'seller-reviews');

-- Storage policy for viewing
CREATE POLICY "Anyone can view seller review images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'seller-reviews');