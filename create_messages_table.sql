-- Create community_messages table for chat
CREATE TABLE community_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  community_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view messages in their communities" ON community_messages
FOR SELECT USING (
  community_id IN (
    SELECT community_id FROM community_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in their communities" ON community_messages
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  community_id IN (
    SELECT community_id FROM community_members 
    WHERE user_id = auth.uid()
  )
);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
