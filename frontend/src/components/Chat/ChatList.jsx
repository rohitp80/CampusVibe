// ConnectHub - Chat List Component
import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { chatRooms } from '../../data/dummyData.js';
import { 
  MessageCircle, 
  Users, 
  BookOpen, 
  Plus,
  Search,
  Pin
} from 'lucide-react';

const ChatList = () => {
  const { state, actions } = useApp();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatLastMessageTime = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };
  
  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Chats</h2>
              <p className="text-sm text-muted-foreground">
                {filteredRooms.length} conversations
              </p>
            </div>
          </div>
          
          <button className="p-2 hover:bg-secondary/50 rounded-lg transition-colors">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRooms.length > 0 ? (
          <div className="space-y-1 p-4">
            {filteredRooms.map(room => (
              <button
                key={room.id}
                onClick={() => actions.setActiveChat(room.id)}
                className={`
                  w-full flex items-start gap-3 p-4 rounded-xl transition-all duration-200 text-left hover-lift
                  ${state.activeChat === room.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-secondary/30'
                  }
                `}
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={room.avatar}
                    alt={room.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {room.isActive && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-hub-success rounded-full border-2 border-background"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {room.name}
                    </h3>
                    {room.type === 'study' && (
                      <BookOpen className="w-3 h-3 text-hub-accent flex-shrink-0" />
                    )}
                    {room.hasNotes && (
                      <Pin className="w-3 h-3 text-hub-warning flex-shrink-0" />
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {room.lastMessage}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{room.participants}</span>
                    </div>
                    
                    <span className="text-xs text-muted-foreground">
                      {formatLastMessageTime(room.timestamp)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No chats found
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try a different search term'
                : 'Start a conversation to get connected'
              }
            </p>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4 inline mr-2" />
              New Chat
            </button>
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="p-4 border-t border-border">
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center gap-2 p-3 bg-gradient-to-r from-hub-primary/10 to-hub-secondary/10 rounded-lg hover:from-hub-primary/20 hover:to-hub-secondary/20 transition-all">
            <BookOpen className="w-4 h-4 text-hub-accent" />
            <span className="text-sm font-medium text-foreground">Study Group</span>
          </button>
          
          <button className="flex items-center gap-2 p-3 bg-gradient-to-r from-hub-accent/10 to-hub-success/10 rounded-lg hover:from-hub-accent/20 hover:to-hub-success/20 transition-all">
            <Users className="w-4 h-4 text-hub-primary" />
            <span className="text-sm font-medium text-foreground">Community</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatList;