import { supabase } from '../src/lib/supabase.js'

console.log('🔍 Checking if Task 2 migration is needed...\n')

async function checkMigration() {
  try {
    // Check if the trigger function exists
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_name', 'handle_new_user')
      .eq('routine_schema', 'public')

    if (error) {
      console.log('❌ Cannot check functions:', error.message)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Migration already applied - handle_new_user function exists')
      console.log('🚀 Ready to run Task 2 tests')
    } else {
      console.log('⚠️  Migration needed - handle_new_user function not found')
      console.log('📋 Please run migration: 002_auth_setup.sql')
    }

  } catch (error) {
    console.log('⚠️  Migration needed - run 002_auth_setup.sql first')
    console.log('Error:', error.message)
  }
}

checkMigration()
