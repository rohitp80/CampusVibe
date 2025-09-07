import React, { useState, useEffect, useRef } from 'react';
import { useFriends } from '../hooks/useFriends.js';
import { supabase } from '../lib/supabase';
import { MessageCircle, Send, Users, User } from 'lucide-react';

const Chat = () => {
  const { friends, loading } = useFriends();
  const displayFriends = friends;
  
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Get current user on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        setCurrentUser(session.user);
      }
    };
    getCurrentUser();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages and set up real-time subscription
  useEffect(() => {
    if (!selectedFriend || !currentUserId) return;

    loadMessages();
    setupRealtimeSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [selectedFriend, currentUserId]);

  const loadMessages = async () => {
    try {
      setLoadingMessages(true);
      
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .or(`and(user_id.eq.${currentUserId},conversation_id.eq.${getConversationId()}),and(user_id.eq.${selectedFriend.id},conversation_id.eq.${getConversationId()})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const conversationId = getConversationId();
    
    subscriptionRef.current = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch the complete message with profile data
          const { data } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              created_at,
              user_id,
              profiles:user_id (
                id,
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => [...prev, data]);
          }
        }
      )
      .subscribe();
  };

  const getConversationId = () => {
    if (!selectedFriend || !currentUserId) return null;
    // Create consistent conversation ID by sorting user IDs
    const ids = [currentUserId, selectedFriend.id].sort();
    return `${ids[0]}_${ids[1]}`;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend || !currentUserId) return;

    try {
      const conversationId = getConversationId();
      
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          user_id: currentUserId,
          conversation_id: conversationId,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex h-[600px]">
          {/* Friends List */}
          <div className="w-1/3 border-r border-border bg-secondary/20">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Friends ({displayFriends?.length || 0})
              </h2>
            </div>
            
            <div className="overflow-y-auto h-full">
              {displayFriends?.length > 0 ? (
                displayFriends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`p-4 cursor-pointer hover:bg-secondary/50 transition-colors border-b border-border/50 ${
                      selectedFriend?.id === friend.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {friend.avatar_url ? (
                        <img
                          src={friend.avatar_url}
                          alt={friend.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {friend.display_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          @{friend.username}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No friends yet</p>
                  <p className="text-sm">Add friends to start chatting!</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-secondary/10">
                  <div className="flex items-center gap-3">
                    {selectedFriend.avatar_url ? (
                      <img
                        src={selectedFriend.avatar_url}
                        alt={selectedFriend.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {selectedFriend.display_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        @{selectedFriend.username}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender_id === currentUserId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Message ${selectedFriend.display_name}...`}
                      className="flex-1 px-4 py-2 bg-secondary/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder-muted-foreground"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a friend to start chatting</h3>
                  <p className="text-sm">Choose a friend from the list to begin your conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
      
      // Filter messages for this conversation
      const conversationMessages = allMessages.filter(msg => 
        (msg.sender_id === currentUserId && msg.receiver_id === friendId) ||
        (msg.sender_id === friendId && msg.receiver_id === currentUserId)
      );
      
      // Sort by timestamp
      conversationMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      setMessages(conversationMessages);
    } catch (error) {
      console.error('Load messages error:', error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadDemoMessages = (friendId) => {
    try {
      const saved = localStorage.getItem('chatMessages');
      const allMessages = saved ? JSON.parse(saved) : {};
      setMessages(allMessages[friendId] || []);
    } catch (error) {
      console.error('Error loading demo messages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend) return;
    
    const message = {
      id: Date.now(),
      message: newMessage.trim(),
      sender_id: currentUserId,
      receiver_id: selectedFriend.id,
      created_at: new Date().toISOString()
    };
    
    // Get all messages from localStorage
    const saved = localStorage.getItem('allChatMessages');
    const allMessages = saved ? JSON.parse(saved) : [];
    
    // Add new message
    allMessages.push(message);
    localStorage.setItem('allChatMessages', JSON.stringify(allMessages));
    
    // Update current conversation
    loadMessages(selectedFriend.id);
    setNewMessage('');
  };

  const sendRealMessage = async () => {
    try {
      console.log('Sending real message to:', selectedFriend.id);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No session found');
        return;
      }

      console.log('Session found, sending message...');
      const response = await fetch('http://localhost:3000/api/chat/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          receiverId: selectedFriend.id,
          message: newMessage
        })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok) {
        setNewMessage('');
        // Reload messages to get the new one
        await loadMessages(selectedFriend.id);
      } else {
        console.error('Failed to send message:', result);
      }
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const sendDemoMessage = () => {
    const friendId = selectedFriend.id;
    const message = {
      id: Date.now(),
      message: newMessage,
      sender_id: 'current_user',
      created_at: new Date().toISOString()
    };
    
    const saved = localStorage.getItem('chatMessages');
    const allMessages = saved ? JSON.parse(saved) : {};
    const friendMessages = allMessages[friendId] || [];
    
    allMessages[friendId] = [...friendMessages, message];
    localStorage.setItem('chatMessages', JSON.stringify(allMessages));
    
    setMessages([...friendMessages, message]);
    setNewMessage('');
  };

  return (
    <div className="w-full h-[calc(100vh-12rem)] max-w-none">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Friends List */}
        <div className="lg:col-span-1 h-full">
          <div className="h-full bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chats ({displayFriends.length})
              </h2>
            </div>
            <div className="overflow-y-auto h-full">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : displayFriends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No friends to chat with</p>
                  <p className="text-sm text-muted-foreground mt-2">Add friends to start chatting!</p>
                </div>
              ) : (
                displayFriends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className={`p-4 border-b border-border/50 cursor-pointer hover:bg-secondary/30 transition-colors ${
                      selectedFriend?.id === friend.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                        alt={friend.display_name || friend.username}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm truncate">
                          {friend.display_name || friend.username}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Chat Window */}
        <div className="lg:col-span-2 h-full">
          <div className="h-full bg-card border border-border rounded-xl flex flex-col">
            {selectedFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedFriend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedFriend.username}`}
                      alt={selectedFriend.display_name || selectedFriend.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {selectedFriend.display_name || selectedFriend.username}
                      </h3>
                      <p className="text-xs text-muted-foreground">@{selectedFriend.username}</p>
                    </div>
                  </div>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isCurrentUser = message.sender_id === currentUserId;
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg ${
                              isCurrentUser
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-end gap-3">
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full p-3 bg-secondary/30 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                        rows={2}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`
                        p-3 rounded-lg transition-all duration-200 flex-shrink-0
                        ${newMessage.trim()
                          ? 'bg-primary text-primary-foreground hover:opacity-90' 
                          : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                        }
                      `}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Select a friend to chat</h3>
                  <p className="text-muted-foreground">Choose a friend from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
