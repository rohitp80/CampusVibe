import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  User, 
  Globe,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

const Settings = () => {
  const { state, actions } = useApp();
  const [notifications, setNotifications] = useState({
    posts: true,
    comments: true,
    events: false,
    messages: true
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEmail: false,
    showPhone: false
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => actions.setCurrentPage('profile')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </button>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Theme Settings */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sun className="w-5 h-5" />
            Appearance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <button
                onClick={() => actions.setTheme(state.theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
              >
                {state.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {state.theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Account
          </h2>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-3 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" />
                <span>Change Email</span>
              </div>
              <span className="text-sm text-muted-foreground">{state.currentUser?.email}</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 bg-secondary/20 rounded-lg hover:bg-secondary/30 transition-colors">
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4" />
                <span>Change Password</span>
              </div>
            </button>
            
            <button className="w-full flex items-center justify-between p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4" />
                <span>Delete Account</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
