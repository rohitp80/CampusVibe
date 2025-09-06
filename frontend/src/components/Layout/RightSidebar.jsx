// ConnectHub - Right Sidebar Component
import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { connections, events } from '../../data/dummyData.js';
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
  
  // Get upcoming events (next 3)
  const upcomingEvents = events
    .filter(event => event.date > new Date())
    .sort((a, b) => a.date - b.date)
    .slice(0, 3);
  
  // Get suggested connections (first 3)
  const suggestedConnections = connections.slice(0, 3);
  
  return (
    <div className="hidden xl:block w-80 fixed right-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto bg-card border-l border-border shadow-card p-6 space-y-6 z-20">
      {/* Local Happenings */}
      <div className="bg-gradient-to-br from-secondary/20 to-accent/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-hub-primary" />
          <h3 className="font-semibold text-foreground">Local Happenings</h3>
        </div>
        
        <div className="space-y-4">
          {upcomingEvents.map(event => (
            <div 
              key={event.id} 
              className="bg-card/50 rounded-lg p-4 border border-border/50 hover-lift cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <img 
                  src={event.image} 
                  alt={event.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground truncate">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {event.date.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate">
                      {event.location}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => actions.toggleEventAttendance(event.id)}
                    className={`
                      mt-2 px-3 py-1 rounded-full text-xs font-medium transition-colors
                      ${event.isAttending 
                        ? 'bg-hub-success/20 text-hub-success hover:bg-hub-success/30'
                        : 'bg-primary/20 text-primary hover:bg-primary/30'
                      }
                    `}
                  >
                    {event.isAttending ? 'Attending' : 'RSVP'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 px-4 py-2 bg-secondary/50 hover:bg-secondary/70 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <ExternalLink className="w-4 h-4" />
          View All Events
        </button>
      </div>
      
      {/* Random Connections */}
      <div className="bg-gradient-to-br from-primary/5 to-hub-secondary/5 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-hub-secondary" />
          <h3 className="font-semibold text-foreground">Connect Worldwide</h3>
        </div>
        
        <div className="space-y-4">
          {suggestedConnections.map(connection => (
            <div 
              key={connection.id} 
              className="bg-card/50 rounded-lg p-4 border border-border/50 hover-lift"
            >
              <div className="flex items-start gap-3">
                <img 
                  src={connection.avatar} 
                  alt={connection.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground">
                    {connection.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {connection.major} • {connection.year}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {connection.university}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {connection.location}
                    </p>
                  </div>
                  
                  {connection.mutualConnections > 0 && (
                    <p className="text-xs text-hub-accent mt-1">
                      {connection.mutualConnections} mutual connections
                    </p>
                  )}
                  
                  <button
                    onClick={() => actions.connectUser(connection.id)}
                    disabled={connection.isConnected}
                    className={`
                      mt-2 px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1
                      ${connection.isConnected 
                        ? 'bg-hub-success/20 text-hub-success cursor-default'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                      }
                    `}
                  >
                    {connection.isConnected ? (
                      <>
                        <Users className="w-3 h-3" />
                        Connected
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        Connect
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 px-4 py-2 bg-secondary/50 hover:bg-secondary/70 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
          <Users className="w-4 h-4" />
          Discover More
        </button>
      </div>
      
      {/* Quick Stats */}
      <div className="bg-gradient-to-br from-accent/5 to-muted/5 rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Your Impact</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-hub-primary">
              {state.currentUser.followers}
            </div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-hub-secondary">
              {state.posts.filter(p => p.userId === state.currentUser.id).length}
            </div>
            <div className="text-xs text-muted-foreground">Posts</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-hub-accent">
              {state.posts.filter(p => p.userId === state.currentUser.id).reduce((sum, p) => sum + p.likes, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Likes</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-hub-warning">
              {state.events.filter(e => e.isAttending).length}
            </div>
            <div className="text-xs text-muted-foreground">Events</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;