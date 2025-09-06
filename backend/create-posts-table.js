import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPostsTable() {
  console.log('🚀 Creating posts table...');
  
  try {
    // Create posts table using direct SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS posts (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          user_id UUID,
          type TEXT DEFAULT 'text',
          is_anonymous BOOLEAN DEFAULT FALSE,
          tags TEXT[] DEFAULT '{}',
          likes_count INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
        
        -- Allow everyone to read posts
        CREATE POLICY IF NOT EXISTS "Posts are viewable by everyone" 
        ON posts FOR SELECT USING (true);
        
        -- Allow authenticated users to create posts
        CREATE POLICY IF NOT EXISTS "Authenticated users can create posts" 
        ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      `
    });
    
    if (error) {
      console.error('❌ Error creating table:', error);
    } else {
      console.log('✅ Posts table created successfully!');
    }
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('posts')
      .select('count')
      .limit(1);
      
    if (testError) {
      console.log('⚠️  Table test failed:', testError.message);
    } else {
      console.log('✅ Posts table is working!');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

createPostsTable();
