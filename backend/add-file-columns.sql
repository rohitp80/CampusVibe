-- Add file_url and file_name columns to chat_messages table
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT;
