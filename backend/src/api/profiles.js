import { supabase } from '../lib/supabase.js'

export const profilesAPI = {
  // Get user profile with completion status
  async getProfile(userId) {
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

  // Update profile with validation
  async updateProfile(userId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== userId) {
        throw new Error('Unauthorized: Cannot update another user\'s profile')
      }

      // Validate required fields
      if (updates.email && !this.validateEmail(updates.email)) {
        throw new Error('Invalid email format')
      }

      if (updates.phone && !this.validatePhone(updates.phone)) {
        throw new Error('Invalid phone format')
      }

      if (updates.graduation_year && (updates.graduation_year < 2020 || updates.graduation_year > 2030)) {
        throw new Error('Graduation year must be between 2020 and 2030')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()

      if (error) throw error
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Update profile error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Get profiles by filters
  async getProfiles(filters = {}) {
    try {
      let query = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, university, course, year, graduation_year, interests, skills, last_active, status')
        .eq('status', 'active')

      // Apply filters
      if (filters.university) {
        query = query.eq('university', filters.university)
      }
      
      if (filters.course) {
        query = query.eq('course', filters.course)
      }
      
      if (filters.graduation_year) {
        query = query.eq('graduation_year', filters.graduation_year)
      }
      
      if (filters.interests && filters.interests.length > 0) {
        query = query.overlaps('interests', filters.interests)
      }
      
      if (filters.skills && filters.skills.length > 0) {
        query = query.overlaps('skills', filters.skills)
      }

      // Pagination
      const page = filters.page || 1
      const limit = filters.limit || 20
      query = query.range((page - 1) * limit, page * limit - 1)

      // Ordering
      query = query.order('last_active', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error
      
      return { 
        data, 
        error: null,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    } catch (error) {
      console.error('Get profiles error:', error.message)
      return { data: null, error: error.message, pagination: null }
    }
  },

  // Update privacy settings
  async updatePrivacySettings(userId, privacySettings) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== userId) {
        throw new Error('Unauthorized')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ privacy_settings: privacySettings })
        .eq('id', userId)
        .select()

      if (error) throw error
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Update privacy settings error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Update notification preferences
  async updateNotificationPreferences(userId, notificationPreferences) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.id !== userId) {
        throw new Error('Unauthorized')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({ notification_preferences: notificationPreferences })
        .eq('id', userId)
        .select()

      if (error) throw error
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Update notification preferences error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Search profiles
  async searchProfiles(searchTerm, filters = {}) {
    try {
      let query = supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, university, course, graduation_year, interests, skills')
        .eq('status', 'active')

      // Text search
      if (searchTerm) {
        query = query.or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%`)
      }

      // Apply additional filters
      if (filters.university) {
        query = query.eq('university', filters.university)
      }

      const { data, error } = await query.limit(filters.limit || 20)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Search profiles error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Get profile completion suggestions
  async getProfileCompletionSuggestions(userId) {
    try {
      const { data: profile, error } = await this.getProfile(userId)
      if (error) throw error

      const suggestions = []

      if (!profile.bio || profile.bio.length < 10) {
        suggestions.push({
          field: 'bio',
          message: 'Add a bio to tell others about yourself',
          points: 10
        })
      }

      if (!profile.avatar_url) {
        suggestions.push({
          field: 'avatar_url',
          message: 'Upload a profile picture',
          points: 10
        })
      }

      if (!profile.university) {
        suggestions.push({
          field: 'university',
          message: 'Add your university',
          points: 10
        })
      }

      if (!profile.course) {
        suggestions.push({
          field: 'course',
          message: 'Add your course/major',
          points: 10
        })
      }

      if (!profile.interests || profile.interests.length === 0) {
        suggestions.push({
          field: 'interests',
          message: 'Add your interests',
          points: 10
        })
      }

      if (!profile.skills || profile.skills.length === 0) {
        suggestions.push({
          field: 'skills',
          message: 'Add your skills',
          points: 10
        })
      }

      return {
        data: {
          current_completion: profile.profile_completion_percentage || 0,
          suggestions,
          potential_completion: profile.profile_completion_percentage + suggestions.reduce((sum, s) => sum + s.points, 0)
        },
        error: null
      }
    } catch (error) {
      console.error('Get profile completion suggestions error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Validation helpers
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  validatePhone(phone) {
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    const phoneRegex = /^[\+]?[1-9][\d]{9,15}$/
    return phoneRegex.test(cleanPhone)
  },

  // Get profile statistics
  async getProfileStats(userId) {
    try {
      // Get posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get comments count (if comments table exists)
      const { count: commentsCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .catch(() => ({ count: 0 }))

      return {
        data: {
          posts_count: postsCount || 0,
          comments_count: commentsCount || 0,
          // Add more stats as needed
        },
        error: null
      }
    } catch (error) {
      console.error('Get profile stats error:', error.message)
      return { data: null, error: error.message }
    }
  }
}
