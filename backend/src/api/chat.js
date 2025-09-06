import { supabase } from '../lib/supabase.js'

export const chatAPI = {
  // Get user's chat rooms
  async getChatRooms() {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants!inner(
            user_id,
            profiles(username, display_name, avatar_url)
          )
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Get chat rooms error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Create new chat room
  async createChatRoom(name, type = 'group', participantIds = []) {
    try {
      if (!name?.trim()) {
        throw new Error('Chat room name is required')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Authentication required')
      }

      // Create chat room
      const { data: chatRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert([{
          name: name.trim(),
          type
        }])
        .select()
        .single()

      if (roomError) throw roomError

      // Add creator as participant
      const participants = [user.id, ...participantIds].filter((id, index, arr) => 
        arr.indexOf(id) === index // Remove duplicates
      )

      const participantData = participants.map(userId => ({
        chat_id: chatRoom.id,
        user_id: userId
      }))

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participantData)

      if (participantError) throw participantError

      return { data: chatRoom, error: null }
    } catch (error) {
      console.error('Create chat room error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Join chat room
  async joinChatRoom(chatId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Authentication required')
      }

      const { error } = await supabase
        .from('chat_participants')
        .insert([{
          chat_id: chatId,
          user_id: user.id
        }])

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Join chat room error:', error.message)
      return { error: error.message }
    }
  },

  // Leave chat room
  async leaveChatRoom(chatId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Authentication required')
      }

      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', user.id)

      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Leave chat room error:', error.message)
      return { error: error.message }
    }
  },

  // Get messages for a chat room
  async getMessages(chatId, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error
      
      // Reverse to show oldest first
      return { data: data.reverse(), error: null }
    } catch (error) {
      console.error('Get messages error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Send message
  async sendMessage(chatId, content, type = 'text') {
    try {
      if (!content?.trim()) {
        throw new Error('Message content is required')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Authentication required')
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          chat_id: chatId,
          user_id: user.id,
          content: content.trim(),
          type
        }])
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url)
        `)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Send message error:', error.message)
      return { data: null, error: error.message }
    }
  },

  // Subscribe to real-time messages for a chat
  subscribeToMessages(chatId, callback) {
    try {
      const subscription = supabase
        .channel(`chat:${chatId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        }, (payload) => {
          callback(payload.new)
        })
        .subscribe()

      return subscription
    } catch (error) {
      console.error('Subscribe to messages error:', error.message)
      return null
    }
  },

  // Subscribe to real-time chat room updates
  subscribeToChatRooms(callback) {
    try {
      const subscription = supabase
        .channel('chat_rooms')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'chat_rooms'
        }, (payload) => {
          callback(payload)
        })
        .subscribe()

      return subscription
    } catch (error) {
      console.error('Subscribe to chat rooms error:', error.message)
      return null
    }
  },

  // Unsubscribe from real-time updates
  unsubscribe(subscription) {
    if (subscription) {
      subscription.unsubscribe()
    }
  }
}
