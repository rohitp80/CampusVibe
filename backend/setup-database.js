import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up CampusVibe database...');
  
  try {
    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.log('⚠️  Could not check existing tables, proceeding with setup...');
    }
    
    // Create profiles table
    console.log('📝 Creating profiles table...');
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users(id) PRIMARY KEY,
          full_name TEXT,
          username TEXT UNIQUE,
          avatar_url TEXT,
          university TEXT,
          bio TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    // Create posts table
    console.log('📝 Creating posts table...');
    const { error: postsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          user_id UUID REFERENCES auth.users(id),
          type TEXT DEFAULT 'text',
          is_anonymous BOOLEAN DEFAULT FALSE,
          tags TEXT[] DEFAULT '{}',
          likes_count INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    // Test database connection
    const { data, error } = await supabase.from('posts').select('count').limit(1);
    
    if (error) {
      console.log('⚠️  Database setup may need manual configuration');
      console.log('📋 Please run the SQL from database/schema.sql in your Supabase SQL editor');
    } else {
      console.log('✅ Database setup complete!');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('📋 Please run the SQL from database/schema.sql manually in Supabase');
  }
}

setupDatabase();
