import { supabase } from '../lib/supabase.js'

export const postsAPI = {
  // Get posts with pagination and filtering
  async getPosts({ 
    page = 1, 
    limit = 20, 
    communityId = null, 
    userId = null, 
    type = null 
  } = {}) {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url),
          communities:community_id(name, color)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)
      
      // Apply filters
      if (communityId) query = query.eq('community_id', communityId)
      if (userId) query = query.eq('user_id', userId)
      if (type) query = query.eq('type', type)
      
      const { data, error, count } = await query
      
      if (error) throw error
      
      return { 
        data, 
        error: null,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
          hasNext: page * limit < count,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      console.error('Get posts error:', error.message)
      return { data: null, error: error.message, pagination: null }
    }
  },

  // Create new post
  async createPost(postData) {
    try {
      // Validate required fields
      if (!postData.content?.trim()) {
        throw new Error('Post content is required')
      }
      
      if (!postData.type) {
        throw new Error('Post type is required')
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([{
          ...postData,
          user_id: user.id
        }])
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url),
          communities:community_id(name, color)
        `)

      if (error) throw error
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Create post error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Update post
  async updatePost(postId, updates) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update(updates)
        .eq('id', postId)
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url),
          communities:community_id(name, color)
        `)

      if (error) throw error
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Update post error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Delete post
  async deletePost(postId) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Delete post error:', error.message)
      return { error: error.message }
    }
  },

  // Like post
  async likePost(postId) {
    try {
      const { error } = await supabase.rpc('increment_likes', {
        post_id: postId
      })

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Like post error:', error.message)
      return { error: error.message }
    }
  },

  // Unlike post
  async unlikePost(postId) {
    try {
      const { error } = await supabase.rpc('decrement_likes', {
        post_id: postId
      })

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Unlike post error:', error.message)
      return { error: error.message }
    }
  },

  // Get post comments
  async getComments(postId) {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Get comments error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Add comment
  async addComment(postId, content) {
    try {
      if (!content?.trim()) {
        throw new Error('Comment content is required')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('post_comments')
        .insert([{
          post_id: postId,
          user_id: user.id,
          content: content.trim()
        }])
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url)
        `)

      if (error) throw error
      return { data: data[0], error: null }
    } catch (error) {
      console.error('Add comment error:', error.message)
      return { data: null, error: error.message }
    }
  }
}
