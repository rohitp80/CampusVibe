-- Add is_chat_message column to posts table
ALTER TABLE posts 
ADD COLUMN is_chat_message BOOLEAN DEFAULT FALSE;
