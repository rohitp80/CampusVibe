import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useUserProfile } from '../hooks/useUserProfile.js';
import { safeRender } from '../utils/profileUtils.js';
import { User, Mail, MapPin, Loader2 } from 'lucide-react';

const ProfileSafe = () => {
  const { state, actions } = useApp();
  
  // Determine if viewing another user's profile
  const isOwnProfile = !state.viewingProfile;
  const viewingUserId = state.viewingProfile?.id;
  
  // Fetch complete profile data if viewing another user
  const { profileData, loading: profileLoading, error: profileError } = useUserProfile(
    isOwnProfile ? null : viewingUserId
  );
  
  // Use fetched profile data for other users, current user data for own profile
  const rawProfileUser = isOwnProfile ? state.currentUser : (profileData || state.viewingProfile);
  
  console.log('Raw Profile User Data:', rawProfileUser);
  
  if (!rawProfileUser) return <div>No profile data</div>;

  // Show loading state when fetching another user's profile
  if (!isOwnProfile && profileLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if profile fetch failed
  if (!isOwnProfile && profileError) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-12 text-center">
          <p className="text-destructive mb-4">{safeRender(profileError)}</p>
          <button
            onClick={() => {
              actions.setViewingProfile(null);
              actions.setCurrentPage('feed');
            }}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            ← Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-start gap-6">
          <img
            src={rawProfileUser.avatar || rawProfileUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${safeRender(rawProfileUser.username)}`}
            alt={safeRender(rawProfileUser.display_name || rawProfileUser.displayName)}
            className="w-24 h-24 rounded-full object-cover"
          />
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {safeRender(rawProfileUser.display_name || rawProfileUser.displayName)}
                </h1>
                <p className="text-muted-foreground">@{safeRender(rawProfileUser.username)}</p>
              </div>
              
              {!isOwnProfile && (
                <button
                  onClick={() => {
                    actions.setViewingProfile(null);
                    actions.setCurrentPage('feed');
                  }}
                  className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>
            
            {/* Bio */}
            <div className="mb-4">
              <p className="text-foreground">{safeRender(rawProfileUser.bio, "No bio available")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Basic Information
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{safeRender(rawProfileUser.email)}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">{safeRender(rawProfileUser.location)}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">University: {safeRender(rawProfileUser.university)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSafe;
