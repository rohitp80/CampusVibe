import { supabase } from './src/lib/supabase.js';

async function setupMessagesTable() {
  try {
    console.log('Setting up messages table...');
    
    // Create messages table
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create messages table for real-time chat
        CREATE TABLE IF NOT EXISTS messages (
          id BIGSERIAL PRIMARY KEY,
          sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          conversation_id TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their conversations" ON messages;
        DROP POLICY IF EXISTS "Users can send messages" ON messages;

        -- Policy: Users can see messages in conversations they're part of
        CREATE POLICY "Users can view their conversations" ON messages
          FOR SELECT USING (
            auth.uid() = sender_id OR auth.uid() = receiver_id
          );

        -- Policy: Users can send messages
        CREATE POLICY "Users can send messages" ON messages
          FOR INSERT WITH CHECK (auth.uid() = sender_id);

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
        CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
      `
    });

    if (createError) {
      console.error('Error creating table:', createError);
      return;
    }

    console.log('✅ Messages table setup complete!');
    
    // Test the table
    const { data, error: testError } = await supabase
      .from('messages')
      .select('count(*)')
      .limit(1);
      
    if (testError) {
      console.error('Error testing table:', testError);
    } else {
      console.log('✅ Messages table is accessible');
    }

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupMessagesTable();
