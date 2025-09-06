import { supabase } from '../lib/supabase.js'

export const storageAPI = {
  // Upload avatar image
  async uploadAvatar(file, userId = null) {
    try {
      if (!file) {
        throw new Error('File is required')
      }

      const { data: { user } } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id
      
      if (!targetUserId) {
        throw new Error('Authentication required')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${targetUserId}/avatar.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true // Replace existing avatar
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      return { data: { path: data.path, url: publicUrl }, error: null }
    } catch (error) {
      console.error('Upload avatar error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Upload post image
  async uploadPostImage(file) {
    try {
      if (!file) {
        throw new Error('File is required')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Authentication required')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName)

      return { data: { path: data.path, url: publicUrl }, error: null }
    } catch (error) {
      console.error('Upload post image error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Upload chat file
  async uploadChatFile(file, chatId) {
    try {
      if (!file) {
        throw new Error('File is required')
      }

      if (!chatId) {
        throw new Error('Chat ID is required')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Authentication required')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${chatId}/${Date.now()}-${file.name}`
      
      const { data, error } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file)

      if (error) throw error

      // Get signed URL for private access
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('chat-files')
        .createSignedUrl(fileName, 3600) // 1 hour expiry

      if (urlError) throw urlError

      return { 
        data: { 
          path: data.path, 
          url: signedUrlData.signedUrl,
          fileName: file.name,
          size: file.size,
          type: file.type
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Upload chat file error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Delete file
  async deleteFile(bucket, path) {
    try {
      if (!bucket || !path) {
        throw new Error('Bucket and path are required')
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path])

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Delete file error:', error.message)
      return { error: error.message }
    }
  },

  // Get public URL
  getPublicUrl(bucket, path) {
    try {
      if (!bucket || !path) {
        throw new Error('Bucket and path are required')
      }

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      return { data: { url: data.publicUrl }, error: null }
    } catch (error) {
      console.error('Get public URL error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Get signed URL for private files
  async getSignedUrl(bucket, path, expiresIn = 3600) {
    try {
      if (!bucket || !path) {
        throw new Error('Bucket and path are required')
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) throw error
      return { data: { url: data.signedUrl }, error: null }
    } catch (error) {
      console.error('Get signed URL error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // List files in bucket
  async listFiles(bucket, folder = '') {
    try {
      if (!bucket) {
        throw new Error('Bucket is required')
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder)

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('List files error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Validate file type and size
  validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    } = options

    const errors = []

    if (!file) {
      errors.push('File is required')
      return { valid: false, errors }
    }

    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`)
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type must be one of: ${allowedTypes.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
