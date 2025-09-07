import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle, Send, Users, User, Smile } from 'lucide-react';

const CommunityChat = ({ communityId, communityName, isMember }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUserMember, setIsUserMember] = useState(false);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Common emojis
  const emojis = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😭', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏', '🙏', '💪', '✨'];

  // Get current user on mount and check membership
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        if (communityId) {
          checkMembership(session.user.id);
        }
      }
    };
    getCurrentUser();
  }, [communityId]);

  // Check if user is a member of the community
  const checkMembership = async (userId) => {
    try {
      const { data } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userId)
        .single();
      
      setIsUserMember(!!data);
    } catch (error) {
      setIsUserMember(false);
    }
  };

  // Use isMember prop if provided, otherwise use local state
  const canSendMessage = isMember !== undefined ? isMember : isUserMember;

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

    console.log('CommunityChat: Setting up for community:', communityId, 'user:', currentUserId);
    
    loadMessages();
    setupRealtimeSubscription();

    return () => {
      console.log('CommunityChat: Cleaning up subscription');
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [communityId, currentUserId]);

  // Test database access
  useEffect(() => {
    const testDatabaseAccess = async () => {
      if (!communityId || !currentUserId) return;
      
      console.log('🧪 Testing database access...');
      
      // Test 1: Can we read posts at all?
      const { data: allPosts, error: allError } = await supabase
        .from('posts')
        .select('id, content, user_id, community_id')
        .limit(5);
      
      console.log('📊 All posts test:', { data: allPosts, error: allError });
      
      // Test 2: Can we read posts for this community?
      const { data: communityPosts, error: communityError } = await supabase
        .from('posts')
        .select('id, content, user_id, community_id')
        .eq('community_id', communityId)
        .limit(5);
      
      console.log('🏘️ Community posts test:', { data: communityPosts, error: communityError });
      
      // Test 3: Check if real-time is enabled
      const { data: realtimeData, error: realtimeError } = await supabase
        .from('posts')
        .select('id')
        .limit(1);
      
      console.log('⚡ Real-time test query:', { data: realtimeData, error: realtimeError });
    };
    
    testDatabaseAccess();
  }, [communityId, currentUserId]);
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
      console.log('Loading messages for community:', communityId);
      
      // Load community messages from posts table (only chat messages)
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', communityId)
        .eq('is_chat_message', true)
        .eq('community_id', communityId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error loading community messages:', error);
        return;
      }

      console.log('Loaded messages:', data);

      // Transform data to match our component structure
      const transformedMessages = data?.map(msg => ({
        id: msg.id,
        content: msg.content,
        created_at: msg.created_at,
        user_id: msg.user_id,
        profiles: {
          id: msg.user_id,
          username: msg.profiles?.username || 'User',
          display_name: msg.profiles?.display_name || 'User',
          avatar_url: msg.profiles?.avatar_url
        }
      })) || [];

      setMessages(transformedMessages);
      console.log('Set messages in state:', transformedMessages.length);
      
    } catch (error) {
      console.error('Error loading community messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const setupRealtimeSubscription = () => {
    subscriptionRef.current = supabase
      .channel(`community-chat-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          if (payload.new?.community_id === communityId && 
              payload.new?.user_id !== currentUserId &&
              payload.new?.is_chat_message === true) {
            // Fetch complete message with profile data
            const { data, error } = await supabase
              .from('posts')
              .select(`
                id,
                content,
                created_at,
                user_id,
                profiles:user_id (
                  username,
                  display_name,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (!error && data) {
              const newMessage = {
                id: data.id,
                content: data.content,
                created_at: data.created_at,
                user_id: data.user_id,
                profiles: {
                  id: data.user_id,
                  username: data.profiles?.username || 'User',
                  display_name: data.profiles?.display_name || 'User',
                  avatar_url: data.profiles?.avatar_url
                }
              };

              setMessages(prev => {
                const exists = prev.find(msg => msg.id === newMessage.id);
                if (!exists) {
                  return [...prev, newMessage];
                }
                return prev;
              });
              
              setTimeout(() => scrollToBottom(), 100);
            }
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
      .select('username, display_name, avatar_url')
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
        display_name: profile?.display_name || username,
        avatar_url: profile?.avatar_url
      }
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => scrollToBottom(), 100);

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: messageContent,
          user_id: currentUserId,
          community_id: communityId,
          type: 'text',
          is_anonymous: false,
          is_chat_message: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      } else {
        // Replace temp message with real message
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...tempMessage, id: data.id, created_at: data.created_at }
            : msg
        ));
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

          {/* Message Input - Only for members */}
          {canSendMessage ? (
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
          ) : (
            /* Non-member message */
            <div className="p-4 border-t border-border text-center">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Join this community to participate in discussions</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityChat;
