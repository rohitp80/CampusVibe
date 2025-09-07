import React, { useState, useEffect, useRef } from 'react';
import { useFriends } from '../hooks/useFriends.js';
import { supabase } from '../lib/supabase';
import { MessageCircle, Send, Users, User, Smile, Paperclip, Image, FileText, Video } from 'lucide-react';

const Chat = () => {
  const { friends, loading } = useFriends();
  const displayFriends = friends;
  
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const subscriptionRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // Common emojis
  const emojis = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😭', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏', '🙏', '💪', '✨'];

  // Only auto-scroll when sending a new message
  const scrollToBottom = () => {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  };

  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    switch(type) {
      case 'image':
        input.accept = 'image/*';
        break;
      case 'video':
        input.accept = 'video/*';
        break;
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt,.xlsx,.pptx';
        break;
      default:
        input.accept = '*/*';
    }
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileUpload(file, type);
      }
    };
    
    input.click();
    setShowAttachMenu(false);
  };

  const handleFileUpload = async (file, type) => {
    try {
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `chat-files/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      // Send message with file attachment
      const fileMessage = type === 'image' ? `📷 Image: ${file.name}` :
                         type === 'video' ? `🎥 Video: ${file.name}` :
                         `📄 ${file.name}`;

      await sendFileMessage(fileMessage, type, publicUrl, file.name);
      
    } catch (error) {
      console.error('Error handling file upload:', error);
    }
  };

  const sendFileMessage = async (content, messageType, fileUrl, fileName) => {
    if (!selectedFriend || !currentUserId) return;

    // Add message to UI immediately (optimistic update)
    const tempMessage = {
      id: `temp_${Date.now()}`,
      content: content,
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      receiver_id: selectedFriend.id,
      is_read: false,
      message_type: messageType,
      file_url: fileUrl,
      file_name: fileName,
      sender: {
        id: currentUserId,
        username: 'You',
        display_name: 'You',
        avatar_url: null
      }
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => scrollToBottom(), 100);

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: content,
          sender_id: currentUserId,
          receiver_id: selectedFriend.id,
          message_type: messageType
        });

      if (error) {
        console.error('Error sending file message:', error);
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }
    } catch (error) {
      console.error('Error sending file message:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.emoji-picker') && !event.target.closest('.emoji-button')) {
        setShowEmojiPicker(false);
      }
      if (!event.target.closest('.attach-menu') && !event.target.closest('.attach-button')) {
        setShowAttachMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load messages and set up real-time subscription
  useEffect(() => {
    if (!selectedFriend || !currentUserId) return;

    setMessages([]); // Clear messages immediately
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
      
      // Load messages between current user and selected friend
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          receiver_id,
          is_read,
          sender:sender_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          receiver:receiver_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${currentUserId})`)
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
    subscriptionRef.current = supabase
      .channel(`chat:${currentUserId}_${selectedFriend.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          // Only show messages for this conversation
          if ((payload.new.sender_id === selectedFriend.id && payload.new.receiver_id === currentUserId) ||
              (payload.new.sender_id === currentUserId && payload.new.receiver_id === selectedFriend.id)) {
            
            // Fetch complete message with profile data
            const { data } = await supabase
              .from('chat_messages')
              .select(`
                id,
                content,
                created_at,
                sender_id,
                receiver_id,
                is_read,
                sender:sender_id (
                  id,
                  username,
                  display_name,
                  avatar_url
                ),
                receiver:receiver_id (
                  id,
                  username,
                  display_name,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (data && payload.new.sender_id !== currentUserId) {
              // Only add if it's from the other person (we handle our own optimistically)
              setMessages(prev => [...prev, data]);
              // Scroll to bottom when receiving new message
              setTimeout(() => scrollToBottom(), 100);
            }
          }
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend || !currentUserId) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    // Add message to UI immediately (optimistic update)
    const tempMessage = {
      id: `temp_${Date.now()}`, // Temporary ID
      content: messageContent,
      created_at: new Date().toISOString(),
      sender_id: currentUserId,
      receiver_id: selectedFriend.id,
      is_read: false,
      sender: {
        id: currentUserId,
        username: 'You',
        display_name: 'You',
        avatar_url: null
      }
    };
    
    setMessages(prev => [...prev, tempMessage]);
    // Scroll to bottom when sending message
    setTimeout(() => scrollToBottom(), 100);

    try {
      // Send to database
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          content: messageContent,
          sender_id: currentUserId,
          receiver_id: selectedFriend.id,
          message_type: 'text'
        });

      if (error) {
        console.error('Error sending message:', error);
        // Remove the optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        return;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
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
                <div className="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
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

                  {/* Attachment Menu */}
                  {showAttachMenu && (
                    <div className="absolute bottom-16 left-16 bg-card border border-border rounded-lg p-2 shadow-lg z-10 attach-menu">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleFileSelect('image')}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded text-sm transition-colors"
                        >
                          <Image className="w-4 h-4" />
                          Image
                        </button>
                        <button
                          onClick={() => handleFileSelect('video')}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded text-sm transition-colors"
                        >
                          <Video className="w-4 h-4" />
                          Video
                        </button>
                        <button
                          onClick={() => handleFileSelect('document')}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-secondary rounded text-sm transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Document
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 items-center">
                    {/* Attachment Button */}
                    <button
                      onClick={() => {
                        setShowAttachMenu(!showAttachMenu);
                        setShowEmojiPicker(false);
                      }}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors attach-button"
                    >
                      <Paperclip className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {/* Emoji Button */}
                    <button
                      onClick={() => {
                        setShowEmojiPicker(!showEmojiPicker);
                        setShowAttachMenu(false);
                      }}
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
                      placeholder={`Message ${selectedFriend.display_name}...`}
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
