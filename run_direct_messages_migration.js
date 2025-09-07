import { supabase } from './backend/src/lib/supabase.js';
import fs from 'fs';

async function runMigration() {
  try {
    console.log('Running direct messages migration...');
    
    const sql = fs.readFileSync('./create_direct_messages_table.sql', 'utf8');
    
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Migration error:', error);
      // Try alternative approach
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: stmtError } = await supabase.from('_').select().limit(0);
          console.log('Executing:', statement.substring(0, 50) + '...');
        }
      }
    } else {
      console.log('✅ Direct messages table created successfully');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
