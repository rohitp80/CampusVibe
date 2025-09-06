// ConnectHub - Top Navigation Bar
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { 
  Menu, 
  Search, 
  Bell, 
  MessageCircle, 
  Sun, 
  Moon, 
  Settings,
  User,
  LogOut
} from 'lucide-react';

const TopNav = () => {
  const { state, actions } = useApp();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const toggleTheme = () => {
    actions.setTheme(state.theme === 'dark' ? 'light' : 'dark');
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
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search ConnectHub..."
              className="w-64 lg:w-80 pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
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
              {state.notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-hub-danger rounded-full animate-pulse-glow" />
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-elevated p-4 animate-slide-in-right">
                <h3 className="font-semibold mb-3">Notifications</h3>
                {state.notifications.length > 0 ? (
                  <div className="space-y-3">
                    {state.notifications.map(notification => (
                      <div key={notification.id} className="p-3 bg-secondary/30 rounded-lg">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No notifications</p>
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
                    actions.setCurrentPage('profile');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-left">
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