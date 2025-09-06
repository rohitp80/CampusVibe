import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Hash, Users, MessageCircle, Send, ArrowLeft, Paperclip, Download, FileText, Image, Smile } from 'lucide-react';

const Community = () => {
  const { state, actions } = useApp();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  
  const currentCommunity = state.selectedCommunity || {
    id: 1,
    name: "CodeCoffee",
    description: "Developers sharing code snippets and programming tips",
    memberCount: 1247,
    color: "#8B5CF6"
  };

  // Common emojis for quick access
  const commonEmojis = [
    '😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', 
    '👍', '👎', '👏', '🙌', '💪', '🔥', '❤️', '💯',
    '🎉', '🎊', '✨', '⭐', '💡', '🚀', '💻', '📱',
    '☕', '🍕', '🎵', '📚', '✅', '❌', '⚡', '🌟'
  ];

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch messages when component loads
  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();
    
    return () => {
      // Cleanup subscription
      supabase.removeAllChannels();
    };
  }, [currentCommunity.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/chat/community/${currentCommunity.id}/messages`);
      if (response.ok) {
        const result = await response.json();
        setMessages(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to real-time changes
    const channel = supabase
      .channel(`community_${currentCommunity.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${currentCommunity.id}`
        },
        (payload) => {
          console.log('New message received:', payload.new);
          setMessages(prev => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    const messageText = message.trim();
    setMessage(''); // Clear input immediately
    
    try {
      const response = await fetch(`http://localhost:3000/api/chat/community/${currentCommunity.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          username: state.currentUser?.username || 'You',
          user_id: state.currentUser?.id || 'anonymous'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Add message directly to state (no real-time subscription working yet)
        setMessages(prev => [...prev, result.data]);
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('username', state.currentUser?.username || 'You');
      formData.append('user_id', state.currentUser?.id || 'anonymous');

      const response = await fetch(`http://localhost:3000/api/chat/community/${currentCommunity.id}/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setMessages(prev => [...prev, result.data]);
      } else {
        console.error('Failed to upload file');
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => actions.setCurrentPage('explore')}
              className="p-2 hover:bg-secondary rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: currentCommunity.color }}
            >
              {currentCommunity.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Hash className="w-6 h-6" />
                {currentCommunity.name}
              </h1>
              <p className="text-muted-foreground">{currentCommunity.description}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{currentCommunity.memberCount} members</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>Real-time chat</span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Community Chat</h2>
        
        {/* Messages */}
        <div className="space-y-3 mb-4 h-80 overflow-y-auto">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading messages...</div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {msg.username.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{msg.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Check if message contains file info */}
                    {msg.message.includes('📎') && msg.message.includes('|') ? (
                      (() => {
                        const [displayText, fileInfoStr] = msg.message.split(' | ');
                        try {
                          const fileInfo = JSON.parse(fileInfoStr);
                          return (
                            <div className="bg-secondary p-3 rounded-lg max-w-xs">
                              <div className="flex items-center gap-2 mb-2">
                                {getFileIcon(fileInfo.fileName)}
                                <span className="text-sm font-medium">{fileInfo.fileName}</span>
                              </div>
                              {fileInfo.fileSize && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  {formatFileSize(fileInfo.fileSize)}
                                </p>
                              )}
                              <a 
                                href={fileInfo.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-primary hover:underline text-sm"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </a>
                            </div>
                          );
                        } catch (e) {
                          return <p className="text-sm">{msg.message}</p>;
                        }
                      })()
                    ) : (
                      /* Regular Text Message */
                      <p className="text-sm">{msg.message}</p>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Message Input */}
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.rar"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 hover:bg-secondary rounded-lg disabled:opacity-50"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 hover:bg-secondary rounded-lg"
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerRef}
                  className="absolute bottom-12 left-0 bg-card border border-border rounded-lg p-3 shadow-lg z-10 w-64"
                >
                  <div className="grid grid-cols-8 gap-1">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => addEmoji(emoji)}
                        className="p-2 hover:bg-secondary rounded text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          {uploading && (
            <div className="mt-2 text-sm text-muted-foreground">
              Uploading file...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;
