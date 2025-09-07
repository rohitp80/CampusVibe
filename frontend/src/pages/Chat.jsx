import React, { useState, useEffect } from 'react';
import { useFriends } from '../hooks/useFriends.js';
import { supabase } from '../lib/supabase';
import { MessageCircle, Send, Users } from 'lucide-react';

const Chat = () => {
  const { friends, loading } = useFriends();
  
  // Use only real friends
  const displayFriends = friends;
  
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get current user ID on mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setCurrentUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Load messages and poll for updates
  useEffect(() => {
    if (!selectedFriend || !currentUserId) return;

    loadMessages(selectedFriend.id);

    // Poll for new messages every 1 second
    const interval = setInterval(() => {
      loadMessages(selectedFriend.id);
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedFriend, currentUserId]);

  const loadMessages = async (friendId) => {
    try {
      setLoadingMessages(true);
      
      // Get all messages from localStorage
      const saved = localStorage.getItem('allChatMessages');
      const allMessages = saved ? JSON.parse(saved) : [];
      
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
