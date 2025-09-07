-- Create dedicated chat_messages table for direct messaging
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages they sent or received
CREATE POLICY "Users can view their messages" ON chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Policy: Users can send messages
CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can update their own messages (for read status)
CREATE POLICY "Users can update message status" ON chat_messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_receiver ON chat_messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(sender_id, receiver_id, created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_messages_updated_at();
