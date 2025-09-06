import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
  }
}

// API client
export const api = {
  // Authentication
  auth: {
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      return { data, error }
    },
    
    signUp: async (email: string, password: string, full_name?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name }
        }
      })
      return { data, error }
    },
    
    signOut: async () => {
      const { error } = await supabase.auth.signOut()
      return { error }
    },
    
    getSession: async () => {
      const { data, error } = await supabase.auth.getSession()
      return { data, error }
    }
  },

  // Posts
  posts: {
    getAll: async (page = 1, limit = 20) => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)
      
      return { data, error }
    },
    
    create: async (post: { title: string; content: string; type?: string; is_anonymous?: boolean; tags?: string[] }) => {
      const { data, error } = await supabase
        .from('posts')
        .insert(post)
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .single()
      
      return { data, error }
    },
    
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('id', id)
        .single()
      
      return { data, error }
    },
    
    like: async (postId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single()
      
      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)
        
        return { data: { liked: false }, error }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id })
        
        return { data: { liked: true }, error }
      }
    }
  },

  // Profiles
  profiles: {
    getCurrent: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: null, error: new Error('Not authenticated') }
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      return { data, error }
    },
    
    update: async (updates: { full_name?: string; bio?: string; college?: string; course?: string; year?: number }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single()
      
      return { data, error }
    },
    
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, bio, college, course, year, avatar_url, created_at')
        .eq('id', id)
        .single()
      
      return { data, error }
    }
  }
}

// HTTP client for backend API (if needed)
export const httpClient = {
  get: async (endpoint: string) => {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers })
    return response.json()
  },
  
  post: async (endpoint: string, data: any) => {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    })
    return response.json()
  },
  
  put: async (endpoint: string, data: any) => {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    })
    return response.json()
  },
  
  delete: async (endpoint: string) => {
    const headers = await getAuthHeaders()
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers
    })
    return response.json()
  }
}
