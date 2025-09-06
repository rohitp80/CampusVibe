import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'placeholder-key'

// Only create client if we have valid credentials
let supabase = null
try {
  if (supabaseUrl !== 'https://placeholder.supabase.co' && supabaseKey !== 'placeholder-key') {
    supabase = createClient(supabaseUrl, supabaseKey)
  } else {
    console.log('⚠️  Using placeholder Supabase credentials - configure .env file')
  }
} catch (error) {
  console.log('⚠️  Supabase client creation failed - check credentials')
}

export { supabase }
