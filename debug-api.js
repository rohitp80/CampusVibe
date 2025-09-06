// Debug script to test API systematically
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3000/api';

async function debugAPI() {
  console.log('🔍 Starting API Debug...\n');
  
  // 1. Test server health
  try {
    console.log('1️⃣ Testing server health...');
    const healthResponse = await fetch(`${API_BASE_URL}/posts`);
    console.log('✅ Server responding:', healthResponse.status);
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
    return;
  }
  
  // 2. Test without auth (should get 401)
  try {
    console.log('\n2️⃣ Testing without auth...');
    const noAuthResponse = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Test post',
        type: 'text',
        is_anonymous: false
      })
    });
    const noAuthData = await noAuthResponse.json();
    console.log('Response:', noAuthResponse.status, noAuthData);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  // 3. Test with invalid auth (should get 401)
  try {
    console.log('\n3️⃣ Testing with invalid auth...');
    const invalidAuthResponse = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      },
      body: JSON.stringify({
        content: 'Test post',
        type: 'text',
        is_anonymous: false
      })
    });
    const invalidAuthData = await invalidAuthResponse.json();
    console.log('Response:', invalidAuthResponse.status, invalidAuthData);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n✅ Debug complete. Check server logs for detailed errors.');
}

debugAPI();
