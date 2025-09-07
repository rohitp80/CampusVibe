// ConnectHub - Right Sidebar Component
import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useFriends } from '../../hooks/useFriends.js';
import { connections, events } from '../../data/dummyData.js';
import FriendRequests from '../Notifications/FriendRequests';
import { 
  Calendar, 
  MapPin, 
  Users, 
  UserPlus, 
  Clock, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

const RightSidebar = () => {
  const { state, actions } = useApp();
  const { friends } = useFriends();
  
  // Get upcoming events (next 3)
  const upcomingEvents = events
    .filter(event => event.date > new Date())
    .sort((a, b) => a.date - b.date)
    .slice(0, 3);
  
  // Get suggested connections (first 3)
  const suggestedConnections = connections.slice(0, 3);
  
  return (
    <div className="hidden xl:block w-80 fixed right-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-card border-l border-border shadow-card p-6 space-y-6 z-20">
      {/* Friend Requests */}
      <div className="bg-card rounded-xl border border-border p-4">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Friend Requests
        </h3>
        <FriendRequests showHeader={false} />
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-br from-accent/5 to-muted/5 rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Your Impact</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-hub-primary">
              {friends?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Friends</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-hub-secondary">
              {state.posts?.filter(p => p.username === state.currentUser?.username).length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Posts</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;