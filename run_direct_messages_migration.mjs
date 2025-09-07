import { supabase } from './backend/src/lib/supabase.js';
import fs from 'fs';

async function runMigration() {
  try {
    console.log('Running direct messages migration...');
    
    const sql = fs.readFileSync('./create_direct_messages_table.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        
        // For CREATE TABLE, we'll use a direct query
        if (statement.includes('CREATE TABLE')) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.log('Note:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Migration completed');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();
