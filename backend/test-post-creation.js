// Comprehensive Post Creation Test
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testPostCreation() {
  console.log('🧪 POST CREATION TEST SUITE');
  console.log('============================\n');

  // Test 1: Direct Supabase Insert (no auth)
  console.log('1️⃣ Testing direct Supabase insert...');
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        content: 'Test post direct insert',
        type: 'text',
        is_anonymous: false,
        user_id: '00000000-0000-0000-0000-000000000000' // dummy UUID
      })
      .select();
    
    if (error) {
      console.log('❌ Direct insert failed:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    } else {
      console.log('✅ Direct insert success:', data[0].id);
    }
  } catch (err) {
    console.log('💥 Unexpected error:', err.message);
  }

  // Test 2: Check RLS policies
  console.log('\n2️⃣ Testing RLS policies...');
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ RLS blocking SELECT:', error.message);
    } else {
      console.log('✅ Can read posts:', data.length, 'posts found');
    }
  } catch (err) {
    console.log('💥 Unexpected error:', err.message);
  }

  // Test 3: Test enum values
  console.log('\n3️⃣ Testing enum values...');
  const validTypes = ['text', 'image', 'code', 'advice'];
  
  for (const type of validTypes) {
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          content: `Test ${type} post`,
          type: type,
          is_anonymous: false,
          user_id: '00000000-0000-0000-0000-000000000000'
        });
      
      if (error) {
        console.log(`❌ Valid type '${type}' failed:`, error.message);
      } else {
        console.log(`✅ Valid type '${type}' accepted`);
      }
    } catch (err) {
      console.log(`💥 Type '${type}' error:`, err.message);
    }
  }

  // Test 4: API endpoint test
  console.log('\n4️⃣ Testing API endpoint...');
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Test via API endpoint',
        type: 'text',
        is_anonymous: false
      })
    });
    
    const result = await response.json();
    console.log('📡 API Response:', response.status, result);
    
  } catch (err) {
    console.log('❌ API test failed:', err.message);
  }

  console.log('\n✅ POST CREATION TEST COMPLETE');
  console.log('===============================');
}

testPostCreation().catch(console.error);
