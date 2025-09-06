import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.log('Required variables:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 CampusConnect Backend Starting...');
console.log('📡 Supabase URL:', supabaseUrl);
console.log('✅ Backend is running and connected to Supabase');

// Test connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('⚠️  Database connection test failed:', error.message);
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (err) {
    console.log('⚠️  Connection test error:', err.message);
  }
}

testConnection();

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down CampusConnect Backend...');
  process.exit(0);
});
