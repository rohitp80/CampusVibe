-- Create community_messages table for community chat
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  community_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  file_url TEXT,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages in communities they're part of
CREATE POLICY "Users can view community messages" ON community_messages
  FOR SELECT USING (true); -- For now, allow all users to view

-- Policy: Users can send messages to communities
CREATE POLICY "Users can send community messages" ON community_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_messages_community_id ON community_messages(community_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at ON community_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_community_messages_user_community ON community_messages(user_id, community_id, created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_community_messages_updated_at
  BEFORE UPDATE ON community_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_community_messages_updated_at();
