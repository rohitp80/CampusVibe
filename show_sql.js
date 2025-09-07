console.log('='.repeat(60));
console.log('DIRECT MESSAGES TABLE SETUP');
console.log('='.repeat(60));
console.log('');
console.log('Please run this SQL in your Supabase SQL editor:');
console.log('');
console.log(`CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation 
ON direct_messages(sender_id, receiver_id, created_at);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON direct_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);`);

console.log('');
console.log('='.repeat(60));
console.log('After running the SQL, restart your backend server');
console.log('='.repeat(60));
