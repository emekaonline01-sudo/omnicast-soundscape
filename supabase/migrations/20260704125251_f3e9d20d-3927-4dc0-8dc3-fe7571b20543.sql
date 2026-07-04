
-- Allow public read on both buckets (needed for <audio> and <img> tags)
CREATE POLICY "Public read covers" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'covers');
CREATE POLICY "Public read audio" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'audio');

-- Admins can write
CREATE POLICY "Admins write covers" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write audio" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'audio' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'audio' AND public.has_role(auth.uid(), 'admin'));
