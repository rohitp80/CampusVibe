// ConnectHub - Chat Window Component
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useChat } from '../../hooks/useChat.js';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  BookOpen
} from 'lucide-react';

const ChatWindow = () => {
  const { state } = useApp();
  const { messages, sendMessage, fetchMessages, subscribeToMessages } = useChat();
  const [message, setMessage] = useState('');
  
  const activeRoom = state.activeChat;
  const roomMessages = messages[activeRoom] || [];
  
  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom);
      const unsubscribe = subscribeToMessages(activeRoom);
      return unsubscribe;
    }
  }, [activeRoom]);
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !activeRoom) return;
    
    await sendMessage(activeRoom, message);
    setMessage('');
  };
  
  if (!activeRoom) {
    return (
      <div className="h-full flex items-center justify-center bg-card border border-border rounded-xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No chat selected
          </h3>
          <p className="text-muted-foreground">
            Choose a chat from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-xl overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">
              {activeRoom.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Chat Room</h3>
            <p className="text-sm text-muted-foreground">Active now</p>
          </div>
        </div>
        
        <button className="p-2 hover:bg-secondary/50 rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {roomMessages.map(msg => (
          <div 
            key={msg.id}
            className={`flex gap-3 ${msg.user_id === state.currentUser?.id ? 'flex-row-reverse' : ''}`}
          >
            <img 
              src={msg.profiles?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
              alt={msg.profiles?.display_name || 'User'}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
            
            <div className={`max-w-xs lg:max-w-md ${msg.user_id === state.currentUser?.id ? 'text-right' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">
                  {msg.profiles?.display_name || 'User'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              
              <div className={`
                px-4 py-2 rounded-xl
                ${msg.user_id === state.currentUser?.id
                  ? 'bg-primary text-primary-foreground ml-auto' 
                  : 'bg-secondary/50 text-foreground'
                }
              `}>
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <button 
                type="button"
                className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </button>
              <button 
                type="button"
                className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
              >
                <Smile className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3 bg-secondary/30 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
              rows={2}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
          </div>
          
          <button
            type="submit"
            disabled={!message.trim()}
            className={`
              p-3 rounded-lg transition-all duration-200 flex-shrink-0
              ${message.trim()
                ? 'bg-primary text-primary-foreground hover:opacity-90' 
                : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
              }
            `}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
