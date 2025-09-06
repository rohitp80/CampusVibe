import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Hash, Users, MessageCircle, Send, ArrowLeft } from 'lucide-react';

const Community = () => {
  const { state, actions } = useApp();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentCommunity = state.selectedCommunity || {
    id: 1,
    name: "CodeCoffee",
    description: "Developers sharing code snippets and programming tips",
    memberCount: 1247,
    color: "#8B5CF6"
  };

  // Fetch messages when component loads
  useEffect(() => {
    fetchMessages();
    // Set up polling for real-time updates
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [currentCommunity.id]);

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

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/chat/community/${currentCommunity.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim(),
          username: state.currentUser?.username || 'You'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessages(prev => [...prev, result.data]);
        setMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
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
        <div className="space-y-3 mb-4 h-64 overflow-y-auto">
          {loading ? (
            <div className="text-center text-muted-foreground">Loading messages...</div>
          ) : (
            messages.map(msg => (
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
                  <p className="text-sm">{msg.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Message Input */}
        <div className="flex gap-2">
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
      </div>
    </div>
  );
};

export default Community;
