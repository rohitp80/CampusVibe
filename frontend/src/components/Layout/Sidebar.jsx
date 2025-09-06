// ConnectHub - Main Sidebar Component
import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { communities, moods } from '../../data/dummyData.js';
import { 
  Home, 
  Search, 
  BookOpen, 
  MapPin, 
  Heart, 
  MessageCircle,
  Users,
  TrendingUp,
  Hash,
  Plus,
  Bookmark
} from 'lucide-react';

const Sidebar = () => {
  const { state, actions } = useApp();
  
  const navigationItems = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'explore', label: 'Explore', icon: Search },
    { id: 'local', label: 'Local', icon: MapPin },
    { id: 'wellness', label: 'Wellness', icon: Heart },
    { id: 'saved', label: 'Saved Posts', icon: Bookmark },
    { id: 'chat', label: 'Chat', icon: MessageCircle }
  ];
  
  const trendingCommunities = communities.filter(c => c.trending);
  
  return (
    <aside className={`
      fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border shadow-card z-40
      transition-all duration-300 ease-out
      ${state.sidebarCollapsed 
        ? 'w-16 -translate-x-full lg:translate-x-0' 
        : 'w-80 translate-x-0'
      }
    `}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            {!state.sidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-gradient-primary">ConnectHub</h1>
                <p className="text-sm text-muted-foreground">College Network</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Main Navigation */}
            <nav className="space-y-2">
              {navigationItems.map(item => {
                const Icon = item.icon;
                const isActive = state.currentPage === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => actions.setCurrentPage(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-xl
                      transition-all duration-200 hover-lift
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-glow' 
                        : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!state.sidebarCollapsed && (
                      <>
                        <span className="font-medium">{item.label}</span>
                        {item.id === 'saved' && state.savedPosts?.length > 0 && (
                          <span className="ml-auto bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                            {state.savedPosts.length}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </nav>
            
            {!state.sidebarCollapsed && (
              <>
                {/* Trending Communities */}
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-hub-secondary" />
                    <h3 className="font-semibold text-sm text-foreground">Trending</h3>
                  </div>
                  <div className="space-y-2">
                    {trendingCommunities.map(community => (
                      <button
                        key={community.id}
                        onClick={() => actions.filterByCommunity(community.name)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                      >
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: community.color }}
                        />
                        <div className="text-left min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground truncate">
                            #{community.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {community.memberCount.toLocaleString()} members
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Quick Moods */}
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Hash className="w-4 h-4 text-hub-accent" />
                    <h3 className="font-semibold text-sm text-foreground">Quick Moods</h3>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {moods.slice(0, 8).map(mood => (
                      <button
                        key={mood.id}
                        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors group"
                        title={mood.name}
                      >
                        <span className="text-lg group-hover:scale-110 transition-transform block">
                          {mood.emoji}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border">
          {!state.sidebarCollapsed && (
            <div className="text-center">
              <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4 inline mr-2" />
                Create Post
              </button>
            </div>
          )}
        </div>
        </div>
      </aside>
  );
};

export default Sidebar;