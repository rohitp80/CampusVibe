import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDirectMessages() {
  try {
    // Create direct_messages table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS direct_messages (
          id BIGSERIAL PRIMARY KEY,
          sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

        -- Policy: Users can see messages they sent or received
        CREATE POLICY "Users can view their own messages" ON direct_messages
          FOR SELECT USING (
            auth.uid() = sender_id OR auth.uid() = receiver_id
          );

        -- Policy: Users can insert messages they send
        CREATE POLICY "Users can send messages" ON direct_messages
          FOR INSERT WITH CHECK (auth.uid() = sender_id);

        -- Enable real-time
        ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
      `
    });

    if (error) {
      console.error('Error creating table:', error);
    } else {
      console.log('✅ Direct messages table created successfully');
    }
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupDirectMessages();
