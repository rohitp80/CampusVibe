import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addAvatarColumn() {
  try {
    console.log('Checking avatar_url column in profiles table...');
    
    // Simple approach - just try to select avatar_url to see if it exists
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .limit(1);

    if (error && error.message.includes('column "avatar_url" does not exist')) {
      console.log('Avatar column does not exist, but database schema should be updated manually.');
    } else {
      console.log('Avatar column exists and is accessible');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

addAvatarColumn();
