// ConnectHub - Chat Page
import React from 'react';
import ChatList from '../components/Chat/ChatList.jsx';
import ChatWindow from '../components/Chat/ChatWindow.jsx';
import { MessageCircle } from 'lucide-react';

const Chat = () => {
  return (
    <div className="w-full h-[calc(100vh-12rem)] max-w-none">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Chat List */}
        <div className="lg:col-span-1 h-full">
          <div className="h-full bg-card border border-border rounded-xl overflow-hidden">
            <ChatList />
          </div>
        </div>
        
        {/* Chat Window */}
        <div className="lg:col-span-2 h-full">
          <ChatWindow />
        </div>
      </div>
    </div>
  );
};

export default Chat;
