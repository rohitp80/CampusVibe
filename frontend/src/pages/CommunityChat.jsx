import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle, Send, Users, User, Smile } from 'lucide-react';

const CommunityChat = ({ communityId, communityName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Common emojis
  const emojis = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😭', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏', '🙏', '💪', '✨'];

  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    const messagesContainer = document.querySelector('.community-messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  // Load messages and set up real-time subscription
  useEffect(() => {
    if (!communityId || !currentUserId) return;

    loadMessages();
    setupRealtimeSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [communityId, currentUserId]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.emoji-picker') && !event.target.closest('.emoji-button')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMessages = async () => {
    try {
      setLoadingMessages(true);
      
      // Load community messages using existing schema
      const { data, error } = await supabase
        .from('community_messages')
        .select(`
          id,
          message,
          created_at,
          user_id,
          username
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading community messages:', error);
        return;
      }

      // Transform data to match our component structure
      const transformedMessages = data?.map(msg => ({
        id: msg.id,
        content: msg.message,
        created_at: msg.created_at,
        user_id: msg.user_id,
        profiles: {
          id: msg.user_id,
          username: msg.username,
          display_name: msg.username,
          avatar_url: null
        }
      })) || [];

      setMessages(transformedMessages);
      
    } catch (error) {
      console.error('Error loading community messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const setupRealtimeSubscription = () => {
    subscriptionRef.current = supabase
      .channel(`community_chat:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`
        },
        async (payload) => {
          // Transform new message to match component structure
          const newMessage = {
            id: payload.new.id,
            content: payload.new.message,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            profiles: {
              id: payload.new.user_id,
              username: payload.new.username,
              display_name: payload.new.username,
              avatar_url: null
            }
          };

          if (payload.new.user_id !== currentUserId) {
            setMessages(prev => [...prev, newMessage]);
            setTimeout(() => scrollToBottom(), 100);
          }
        }
      )
      .subscribe();
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !communityId || !currentUserId) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    // Get current user profile for username
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', currentUserId)
      .single();

    const username = profile?.username || 'Unknown';

    // Add message to UI immediately (optimistic update)
    const tempMessage = {
      id: `temp_${Date.now()}`,
      content: messageContent,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      profiles: {
        id: currentUserId,
        username: username,
        display_name: username,
        avatar_url: null
      }
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => scrollToBottom(), 100);

    try {
      const { error } = await supabase
        .from('community_messages')
        .insert({
          message: messageContent,
          user_id: currentUserId,
          username: username,
          community_id: communityId
        });

      if (error) {
        console.error('Error sending message:', error);
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!communityId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Community Selected</h3>
          <p className="text-sm text-muted-foreground">Select a community to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="p-4 border-b border-border bg-secondary/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {communityName || 'Community Chat'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Community Discussion
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 community-messages-container">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {message.profiles?.avatar_url ? (
                      <img
                        src={message.profiles.avatar_url}
                        alt={message.profiles.display_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {message.profiles?.display_name || 'Unknown User'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                  <p className="text-sm">Start the community discussion!</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border relative">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-4 bg-card border border-border rounded-lg p-3 shadow-lg z-10 emoji-picker">
                <div className="grid grid-cols-5 gap-2 max-w-xs">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => addEmoji(emoji)}
                      className="text-xl hover:bg-secondary rounded p-1 transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 items-center">
              {/* Emoji Button */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors emoji-button"
              >
                <Smile className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Message Input */}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${communityName || 'community'}...`}
                className="flex-1 px-4 py-2 bg-secondary/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder-muted-foreground"
              />

              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityChat;
