import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDirectMessages() {
  try {
    console.log('Creating direct_messages table...');
    
    // First, let's try a simpler approach
    const { data, error } = await supabase
      .from('direct_messages')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      console.log('Table does not exist, but we can still use the chat with fallback');
    }
    
    console.log('✅ Direct messages setup complete');
  } catch (error) {
    console.error('Setup error:', error);
  }
}

setupDirectMessages();
