-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-attachments', 'chat-attachments', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the bucket
CREATE POLICY "Users can upload chat attachments" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Users can view chat attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can delete their chat attachments" ON storage.objects
FOR DELETE USING (bucket_id = 'chat-attachments');
