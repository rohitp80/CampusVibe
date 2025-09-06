-- Drop existing policies if they exist
DROP POLICY IF EXISTS "chat_rooms_access" ON chat_rooms;
DROP POLICY IF EXISTS "participants_access" ON chat_participants;
DROP POLICY IF EXISTS "messages_access" ON messages;

-- Disable RLS temporarily
ALTER TABLE chat_rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policies for chat_rooms (users can see chats they participate in)
CREATE POLICY "chat_rooms_select" ON chat_rooms FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.chat_id = chat_rooms.id 
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "chat_rooms_insert" ON chat_rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "chat_rooms_update" ON chat_rooms FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.chat_id = chat_rooms.id 
    AND chat_participants.user_id = auth.uid()
  )
);

-- Fixed RLS policies for chat_participants
CREATE POLICY "participants_select" ON chat_participants FOR SELECT USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.chat_id = chat_participants.chat_id 
    AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "participants_insert" ON chat_participants FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

CREATE POLICY "participants_delete" ON chat_participants FOR DELETE USING (
  user_id = auth.uid()
);

-- Fixed RLS policies for messages
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.chat_id = messages.chat_id 
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.chat_id = messages.chat_id 
    AND chat_participants.user_id = auth.uid()
  )
);

CREATE POLICY "messages_update" ON messages FOR UPDATE USING (
  user_id = auth.uid()
);

CREATE POLICY "messages_delete" ON messages FOR DELETE USING (
  user_id = auth.uid()
);
