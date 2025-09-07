import { supabase } from './src/lib/supabase.js';
import fs from 'fs';
import path from 'path';

async function setupChatDatabase() {
  try {
    console.log('Setting up chat messages database...');
    
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'backend', 'create-chat-messages-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.trim().substring(0, 50) + '...');
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement.trim() + ';'
        });
        
        if (error) {
          console.error('Error executing statement:', error);
          // Continue with other statements
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('🎉 Chat database setup complete!');
    
    // Test the table
    const { data, error: testError } = await supabase
      .from('chat_messages')
      .select('count(*)')
      .limit(1);
      
    if (testError) {
      console.error('❌ Error testing table:', testError);
    } else {
      console.log('✅ Chat messages table is accessible');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupChatDatabase();
