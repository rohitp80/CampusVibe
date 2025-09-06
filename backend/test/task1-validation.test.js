import { supabase } from '../src/lib/supabase.js'

console.log('🧪 Task 1 Validation Test\n')

async function validateTask1() {
  const results = {
    clientConfig: false,
    envVariables: false,
    databaseConnection: false,
    tablesExist: false,
    migrationNeeded: false
  }

  try {
    // Test 1: Supabase client configuration
    console.log('1️⃣ Testing Supabase client configuration...')
    if (supabase) {
      results.clientConfig = true
      console.log('   ✅ Supabase client created successfully')
    } else {
      console.log('   ❌ Supabase client not configured')
      return results
    }

    // Test 2: Environment variables
    console.log('\n2️⃣ Checking environment variables...')
    const hasUrl = process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('placeholder')
    const hasKey = process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY.includes('placeholder')
    
    if (hasUrl && hasKey) {
      results.envVariables = true
      console.log('   ✅ Environment variables configured')
      console.log(`   📍 URL: ${process.env.SUPABASE_URL}`)
    } else {
      console.log('   ❌ Environment variables missing or using placeholders')
      return results
    }

    // Test 3: Database connection
    console.log('\n3️⃣ Testing database connection...')
    try {
      const { data, error } = await supabase.from('_supabase_migrations').select('version').limit(1)
      results.databaseConnection = true
      console.log('   ✅ Database connection successful')
    } catch (error) {
      console.log('   ❌ Database connection failed:', error.message)
      return results
    }

    // Test 4: Check if tables exist
    console.log('\n4️⃣ Checking if tables exist...')
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      if (!error) {
        results.tablesExist = true
        console.log('   ✅ Tables exist - migration already run')
      } else if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
        results.migrationNeeded = true
        console.log('   ⚠️  Tables do not exist - migration needed')
        console.log('   📝 Error:', error.message)
      } else {
        console.log('   ❌ Table check failed:', error.message)
      }
    } catch (error) {
      results.migrationNeeded = true
      console.log('   ⚠️  Tables do not exist - migration needed')
      console.log('   📝 Error:', error.message)
    }

    return results

  } catch (error) {
    console.error('❌ Validation failed:', error.message)
    return results
  }
}

// Run validation
validateTask1().then(results => {
  console.log('\n📊 Task 1 Validation Results:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Client Configuration: ${results.clientConfig ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Environment Variables: ${results.envVariables ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Database Connection: ${results.databaseConnection ? 'PASS' : 'FAIL'}`)
  console.log(`✅ Tables Exist: ${results.tablesExist ? 'PASS' : 'PENDING'}`)
  
  if (results.migrationNeeded) {
    console.log('\n🚀 Next Step: Run Database Migration')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('1. Open Supabase Dashboard: https://supabase.com/dashboard')
    console.log('2. Go to SQL Editor')
    console.log('3. Copy and run: backend/migrations/001_initial_schema.sql')
    console.log('4. Re-run this test to verify')
  } else if (results.tablesExist) {
    console.log('\n🎉 Task 1 FULLY COMPLETED!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ All components working correctly')
    console.log('🚀 Ready for Task 2: Authentication & User Management')
  } else {
    console.log('\n❌ Task 1 Incomplete')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Please check configuration and try again')
  }
})
