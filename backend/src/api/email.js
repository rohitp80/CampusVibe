import { supabase } from '../lib/supabase.js'

export const emailAPI = {
  // Send test email via Supabase Auth (signup confirmation)
  async sendTestEmail(email) {
    try {
      // Use Supabase's built-in email system by triggering a signup
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'temp_password_123!',
        options: {
          data: {
            username: 'test_user',
            display_name: 'Test User',
            test_email: true
          }
        }
      })

      if (error) throw error
      
      return { 
        data: { 
          message: 'Test email sent successfully',
          email: email,
          user_id: data.user?.id
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Send test email error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Send password reset email
  async sendPasswordReset(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`
      })

      if (error) throw error
      
      return { 
        data: { 
          message: 'Password reset email sent',
          email: email
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Send password reset error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Resend confirmation email
  async resendConfirmation(email) {
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) throw error
      
      return { 
        data: { 
          message: 'Confirmation email resent',
          email: email
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Resend confirmation error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Send magic link email
  async sendMagicLink(email) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`
        }
      })

      if (error) throw error
      
      return { 
        data: { 
          message: 'Magic link sent successfully',
          email: email
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Send magic link error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Test email deliverability
  async testEmailDeliverability(email) {
    try {
      console.log(`Testing email deliverability for: ${email}`)
      
      // Try multiple email methods to test deliverability
      const results = {
        signup: null,
        magicLink: null,
        passwordReset: null
      }

      // Test 1: Signup email
      try {
        const signupResult = await this.sendTestEmail(email)
        results.signup = signupResult.error ? 'FAILED' : 'SUCCESS'
      } catch (error) {
        results.signup = 'FAILED'
      }

      // Test 2: Magic link
      try {
        const magicResult = await this.sendMagicLink(email)
        results.magicLink = magicResult.error ? 'FAILED' : 'SUCCESS'
      } catch (error) {
        results.magicLink = 'FAILED'
      }

      // Test 3: Password reset (only if user exists)
      try {
        const resetResult = await this.sendPasswordReset(email)
        results.passwordReset = resetResult.error ? 'FAILED' : 'SUCCESS'
      } catch (error) {
        results.passwordReset = 'FAILED'
      }

      return {
        data: {
          email: email,
          results: results,
          summary: `Tested ${Object.keys(results).length} email types`
        },
        error: null
      }
    } catch (error) {
      console.error('Email deliverability test error:', error.message)
      return { data: null, error: error.message }
    }
  }
}
