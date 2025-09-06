// ConnectHub - Chat List Component
import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useChat } from '../../hooks/useChat.js';
import { 
  MessageCircle, 
  Users, 
  Plus,
  Search
} from 'lucide-react';

const ChatList = () => {
  const { state, actions } = useApp();
  const { chatRooms, createChatRoom, loading } = useChat();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCreateChat = async () => {
    const name = prompt('Enter chat name:');
    if (name) {
      const newRoom = await createChatRoom(name);
      if (newRoom) {
        actions.setActiveChat(newRoom.id);
      }
    }
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
          
          <button 
            onClick={handleCreateChat}
            className="p-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
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
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading chats...</p>
          </div>
        ) : filteredRooms.length > 0 ? (
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
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {room.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {room.name}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    {room.messages?.[0]?.content || 'No messages yet'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{room.chat_participants?.length || 0}</span>
                    </div>
                    
                    <span className="text-xs text-muted-foreground">
                      {new Date(room.updated_at).toLocaleDateString()}
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
            <button 
              onClick={handleCreateChat}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              New Chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatList;