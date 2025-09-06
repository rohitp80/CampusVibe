-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('post-images', 'post-images', true),
  ('chat-files', 'chat-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars (public bucket)
CREATE POLICY "avatar_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatar_view" ON storage.objects FOR SELECT USING (
  bucket_id = 'avatars'
);

CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatar_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for post images (public bucket)
CREATE POLICY "post_images_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'post-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "post_images_view" ON storage.objects FOR SELECT USING (
  bucket_id = 'post-images'
);

CREATE POLICY "post_images_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'post-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "post_images_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'post-images' AND 
  auth.role() = 'authenticated'
);

-- Storage policies for chat files (private bucket)
CREATE POLICY "chat_files_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'chat-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "chat_files_access" ON storage.objects FOR SELECT USING (
  bucket_id = 'chat-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "chat_files_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'chat-files' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "chat_files_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'chat-files' AND 
  auth.role() = 'authenticated'
);
