import { emailAPI } from '../src/api/email.js'

console.log('📧 CampusConnect Email Testing System\n')

async function testEmailSystem() {
  const testEmail = 'karancoderg@gmail.com'
  
  try {
    console.log(`🎯 Testing email delivery to: ${testEmail}\n`)

    // Test 1: Send Magic Link (most reliable)
    console.log('Test 1: Sending Magic Link email...')
    const { data: magicData, error: magicError } = await emailAPI.sendMagicLink(testEmail)
    
    if (magicError) {
      console.log(`   ❌ Magic Link failed: ${magicError}`)
    } else {
      console.log(`   ✅ Magic Link sent successfully to ${testEmail}`)
      console.log(`   📨 Check your inbox for the magic link!`)
    }

    // Wait a moment between requests
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test 2: Send Password Reset
    console.log('\nTest 2: Sending Password Reset email...')
    const { data: resetData, error: resetError } = await emailAPI.sendPasswordReset(testEmail)
    
    if (resetError) {
      console.log(`   ❌ Password Reset failed: ${resetError}`)
    } else {
      console.log(`   ✅ Password Reset sent successfully to ${testEmail}`)
      console.log(`   📨 Check your inbox for the reset link!`)
    }

    // Wait a moment between requests
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Test 3: Send Test Signup Email
    console.log('\nTest 3: Sending Test Signup email...')
    const { data: signupData, error: signupError } = await emailAPI.sendTestEmail(testEmail)
    
    if (signupError) {
      console.log(`   ❌ Test Signup failed: ${signupError}`)
    } else {
      console.log(`   ✅ Test Signup sent successfully to ${testEmail}`)
      console.log(`   📨 Check your inbox for the confirmation email!`)
      console.log(`   👤 Test user created with ID: ${signupData.user_id}`)
    }

    // Test 4: Comprehensive Deliverability Test
    console.log('\nTest 4: Running comprehensive deliverability test...')
    const { data: deliveryData, error: deliveryError } = await emailAPI.testEmailDeliverability(testEmail)
    
    if (deliveryError) {
      console.log(`   ❌ Deliverability test failed: ${deliveryError}`)
    } else {
      console.log(`   ✅ Deliverability test completed`)
      console.log(`   📊 Results:`)
      Object.entries(deliveryData.results).forEach(([type, status]) => {
        const icon = status === 'SUCCESS' ? '✅' : '❌'
        console.log(`      ${icon} ${type}: ${status}`)
      })
    }

    console.log('\n🎉 Email testing completed!')
    console.log('\n📋 What to check:')
    console.log(`1. Check inbox: ${testEmail}`)
    console.log('2. Check spam/junk folder')
    console.log('3. Look for emails from: noreply@mail.app.supabase.io')
    console.log('4. Expected emails:')
    console.log('   - Magic link for passwordless login')
    console.log('   - Password reset link')
    console.log('   - Account confirmation email')
    
    console.log('\n⚠️  Note: If emails are not received:')
    console.log('- Supabase may have email rate limits')
    console.log('- Email might be in spam folder')
    console.log('- Check Supabase Auth logs in dashboard')

    return true

  } catch (error) {
    console.error('❌ Email test suite failed:', error.message)
    return false
  }
}

// Run email tests
testEmailSystem().then(success => {
  if (success) {
    console.log('\n✅ Email System Testing COMPLETED!')
    console.log('📧 Emails should be delivered to karancoderg@gmail.com')
  } else {
    console.log('\n❌ Email testing failed.')
    process.exit(1)
  }
})
