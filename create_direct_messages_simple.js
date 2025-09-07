// Simple script to create direct_messages table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️  Supabase credentials not found. Please check your .env file');
  console.log('For now, the chat will work in demo mode with localStorage');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log('Creating direct_messages table...');
  
  // This is a placeholder - in a real setup, you would run this SQL in Supabase dashboard:
  console.log(`
Please run this SQL in your Supabase SQL editor:

CREATE TABLE IF NOT EXISTS direct_messages (
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
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
  `);
  
  console.log('✅ Table creation SQL provided above');
}

createTable();
