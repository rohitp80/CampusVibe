const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('Creating friend_requests table...');
  
  const { error: error1 } = await supabase.rpc('exec_sql', {
    sql: `CREATE TABLE IF NOT EXISTS friend_requests (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(sender_id, receiver_id)
    );`
  });
  
  if (error1) console.log('Table creation result:', error1);
  
  console.log('Creating friendships table...');
  
  const { error: error2 } = await supabase.rpc('exec_sql', {
    sql: `CREATE TABLE IF NOT EXISTS friendships (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user1_id, user2_id),
      CHECK (user1_id < user2_id)
    );`
  });
  
  if (error2) console.log('Friendships table result:', error2);
  
  console.log('Done! Please run the remaining SQL manually in Supabase SQL editor.');
}

createTables();
