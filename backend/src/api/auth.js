import { supabase } from '../lib/supabase.js'

export const authAPI = {
  // Sign up new user
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            display_name: userData.display_name || userData.username
          }
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Signup error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Signin error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Sign in with Google OAuth
  async signInWithGoogle(redirectTo = null) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Google signin error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Sign in with GitHub OAuth (bonus)
  async signInWithGitHub(redirectTo = null) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('GitHub signin error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Handle OAuth callback
  async handleOAuthCallback() {
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      
      if (data.session) {
        // User is authenticated, profile should be auto-created
        return { data: data.session.user, error: null }
      } else {
        throw new Error('No session found after OAuth callback')
      }
    } catch (error) {
      console.error('OAuth callback error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Signout error:', error.message)
      return { error: error.message }
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { data: user, error: null }
    } catch (error) {
      console.error('Get user error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Get user profile
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Get profile error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Update user profile
  async updateProfile(userId, updates) {
    try {
      // First check if user is authenticated and can update this profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== userId) {
        throw new Error('Unauthorized: Cannot update another user\'s profile')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()

      if (error) throw error
      
      // Return single object if array has one item
      return { data: data?.[0] || data, error: null }
    } catch (error) {
      console.error('Update profile error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session)
      })
      
      return subscription
    } catch (error) {
      console.error('Auth state change listener error:', error.message)
      return null
    }
  },

  // Unsubscribe from auth state changes
  unsubscribeAuthStateChange(subscription) {
    if (subscription) {
      subscription.unsubscribe()
    }
  }
}
