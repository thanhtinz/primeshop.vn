-- Add missing columns to design_orders table
ALTER TABLE public.design_orders 
ADD COLUMN IF NOT EXISTS original_amount numeric,
ADD COLUMN IF NOT EXISTS voucher_code text,
ADD COLUMN IF NOT EXISTS voucher_discount numeric DEFAULT 0;

-- Create design-references storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-references', 'design-references', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for design references
CREATE POLICY "Anyone can view design reference images"
ON storage.objects FOR SELECT
USING (bucket_id = 'design-references');

CREATE POLICY "Authenticated users can upload design reference images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'design-references' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own design reference images"
ON storage.objects FOR DELETE
USING (bucket_id = 'design-references' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own design reference images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'design-references' AND auth.uid()::text = (storage.foldername(name))[1]);