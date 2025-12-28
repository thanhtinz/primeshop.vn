-- Create storage bucket for stickers
INSERT INTO storage.buckets (id, name, public) VALUES ('stickers', 'stickers', true);

-- Storage policies for stickers bucket
CREATE POLICY "Public can view stickers" ON storage.objects FOR SELECT USING (bucket_id = 'stickers');

CREATE POLICY "Authenticated users can upload stickers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'stickers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update stickers" ON storage.objects FOR UPDATE USING (bucket_id = 'stickers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete stickers" ON storage.objects FOR DELETE USING (bucket_id = 'stickers' AND auth.role() = 'authenticated');