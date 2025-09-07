// ConnectHub - Top Navigation Bar
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useSearch } from '../../hooks/useSearch.js';
import { useNotifications } from '../../hooks/useNotifications.js';
import { 
  Menu, 
  Search, 
  Bell, 
  MessageCircle, 
  Sun, 
  Moon, 
  Settings,
  User,
  LogOut,
  UserPlus,
  Check,
  X
} from 'lucide-react';

const TopNav = () => {
  const { state, actions } = useApp();
  const { results, loading, searchUsers, setResults } = useSearch();
  const { notifications, unreadCount, markAsRead, markChatAsRead } = useNotifications();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const searchRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
        setShowSearchResults(true);
      } else {
        setResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);
  
  const toggleTheme = () => {
    actions.setTheme(state.theme === 'dark' ? 'light' : 'dark');
  };

  const handleUserSelect = (user) => {
    setSearchQuery('');
    setShowSearchResults(false);
    setResults([]);
    // Navigate to user profile
    actions.setViewingProfile(user);
    actions.setCurrentPage('profile');
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={actions.toggleSidebar}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {/* Search Bar */}
          <div className="relative hidden sm:block" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-12 left-0 w-full bg-card border border-border rounded-xl shadow-elevated max-h-80 overflow-y-auto z-50">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : results.length > 0 ? (
                  <div className="p-2">
                    {results.map(user => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                      >
                        <img
                          src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                          alt={user.display_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.display_name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                          {user.university && (
                            <p className="text-xs text-muted-foreground truncate">{user.university}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length >= 2 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No users found
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Mobile Search */}
          <button className="p-2 rounded-lg hover:bg-secondary/50 transition-colors sm:hidden">
            <Search className="w-5 h-5" />
          </button>
          
          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-secondary/50 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-hub-danger text-white text-xs rounded-full flex items-center justify-center animate-pulse-glow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-96 bg-card border border-border rounded-xl shadow-elevated max-h-96 overflow-y-auto animate-slide-in-right">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                </div>
                
                {notifications.length > 0 ? (
                  <div className="divide-y divide-border">
                    {notifications.map(notification => (
                      <div key={notification.id} className="p-4 hover:bg-secondary/30 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Avatar or Icon */}
                          <div className="flex-shrink-0">
                            {notification.avatar ? (
                              <img
                                src={notification.avatar}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                {notification.type === 'friend_request' ? (
                                  <UserPlus className="w-5 h-5 text-primary" />
                                ) : (
                                  <MessageCircle className="w-5 h-5 text-primary" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {notification.timestamp.toLocaleString()}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex-shrink-0">
                            {notification.type === 'friend_request' ? (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : notification.type === 'chat' ? (
                              <button
                                onClick={() => {
                                  markChatAsRead(notification.data.sender.id);
                                  // Set the selected chat friend and navigate to chat
                                  actions.setSelectedChatFriend(notification.data.sender);
                                  actions.setCurrentPage('chat');
                                  setShowNotifications(false);
                                }}
                                className="text-xs text-primary hover:underline"
                              >
                                View
                              </button>
                            ) : (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications</p>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Messages */}
          <button
            onClick={() => actions.setCurrentPage('chat')}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            {state.theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          
          {/* Profile Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <img
                src={state.currentUser.avatar}
                alt={state.currentUser.displayName}
                className="w-8 h-8 rounded-full"
              />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium">{state.currentUser.displayName}</p>
                <p className="text-xs text-muted-foreground">@{state.currentUser.username}</p>
              </div>
            </button>
            
            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 top-12 w-48 bg-card border border-border rounded-xl shadow-elevated p-2 animate-slide-in-right">
                <button 
                  onClick={() => {
                    actions.setViewingProfile(null); // Clear viewing profile to show own profile
                    actions.setCurrentPage('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Profile</span>
                </button>
                <button 
                  onClick={() => actions.setCurrentPage('settings')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Settings</span>
                </button>
                <hr className="my-2 border-border" />
                <button 
                  onClick={actions.logout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;