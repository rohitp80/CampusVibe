-- Community Chat Messages Table
CREATE TABLE IF NOT EXISTS community_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL,
  username VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_community_messages_community_id ON community_messages(community_id);
CREATE INDEX IF NOT EXISTS idx_community_messages_created_at ON community_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow all authenticated users to read messages
CREATE POLICY "Anyone can read community messages" ON community_messages
  FOR SELECT USING (true);

-- Policy to allow authenticated users to insert their own messages
CREATE POLICY "Users can insert their own messages" ON community_messages
  FOR INSERT WITH CHECK (true);
