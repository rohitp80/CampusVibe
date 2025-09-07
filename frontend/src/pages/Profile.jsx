import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useUserProfile } from '../hooks/useUserProfile.js';
import { safeRender, normalizeProfileData } from '../utils/profileUtils.js';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { useFriends } from '../hooks/useFriends.js';
import FriendRequests from '../components/Notifications/FriendRequests.jsx';
import PostCard from '../components/Post/PostCard.jsx';
import { supabase } from '../lib/supabase.js';
import { 
  User, 
  Mail, 
  MapPin, 
  GraduationCap, 
  Calendar,
  Edit3,
  Save,
  X,
  Phone,
  BookOpen,
  Building,
  Heart,
  Briefcase,
  Link,
  Shield,
  Bell,
  UserPlus,
  Check,
  Loader2,
  Clock
} from 'lucide-react';

const ProfileContent = () => {
  const { state, actions } = useApp();
  const { sendFriendRequest, getFriendshipStatus, loading, friends } = useFriends();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [friendshipStatus, setFriendshipStatus] = useState('none');
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Determine if viewing another user's profile
  const isOwnProfile = !state.viewingProfile;
  const viewingUserId = state.viewingProfile?.id;
  
  // Fetch complete profile data if viewing another user
  const { profileData, loading: profileLoading, error: profileError } = useUserProfile(
    isOwnProfile ? null : viewingUserId
  );
  
  // Use fetched profile data for other users, current user data for own profile
  const rawProfileUser = isOwnProfile 
    ? state.currentUser 
    : (profileData || state.viewingProfile); // Fallback to search data if profile fetch fails
  
  // Normalize profile data to prevent object rendering errors
  const profileUser = normalizeProfileData(rawProfileUser);
  
  const isFriend = state.friends?.some(f => f.username === profileUser.username);
  const hasPendingRequest = state.friendRequests?.some(req => 
    req.from === state.currentUser?.username && req.to === profileUser.username
  );
  // Check friendship status when viewing another user's profile
  useEffect(() => {
    if (!isOwnProfile && profileUser?.username && state.isAuthenticated) {
      const checkStatus = async () => {
        setStatusLoading(true);
        const result = await getFriendshipStatus(profileUser.username);
        if (result.success) {
          setFriendshipStatus(result.status);
        }
        setStatusLoading(false);
      };
      checkStatus();
    } else if (isOwnProfile) {
      setStatusLoading(false);
      setFriendshipStatus('none');
    }
  }, [profileUser?.username, isOwnProfile, state.isAuthenticated]);

  // Handle sending friend request
  const handleSendFriendRequest = async () => {
    console.log('Connect button clicked for user:', profileUser?.username);
    if (!profileUser?.username) {
      console.error('No username found');
      return;
    }
    
    console.log('Calling sendFriendRequest...');
    const result = await sendFriendRequest(profileUser.username);
    console.log('Friend request result:', result);
    
    if (result.success) {
      setFriendshipStatus('request_sent');
      actions.addNotification({
        id: Date.now(),
        type: 'success',
        message: `Friend request sent to ${profileUser.displayName || profileUser.display_name}!`,
        timestamp: new Date()
      });
    } else {
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: result.error || 'Failed to send friend request',
        timestamp: new Date()
      });
    }
  };

  const [editData, setEditData] = useState({
    displayName: state.currentUser?.displayName || '',
    bio: state.currentUser?.bio || '',
    email: state.currentUser?.email || '',
    phone: state.currentUser?.phone || '',
    dateOfBirth: state.currentUser?.dateOfBirth || '',
    gender: state.currentUser?.gender || '',
    location: state.currentUser?.location || '',
    university: state.currentUser?.university || '',
    course: state.currentUser?.course || '',
    department: state.currentUser?.department || '',
    graduationYear: state.currentUser?.graduationYear || '',
    interests: state.currentUser?.interests || [],
    skills: state.currentUser?.skills || [],
    socialLinks: state.currentUser?.socialLinks || {}
  });

  const handleSave = async () => {
    try {
      // Get current Supabase session
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert('Please log in to update your profile');
        return;
      }

      const profileData = {
        display_name: editData.displayName || null,
        bio: editData.bio || null,
        phone: editData.phone || null,
        date_of_birth: editData.dateOfBirth || null,
        gender: editData.gender || null,
        location: editData.location || null,
        university: editData.university || null,
        course: editData.course || null,
        department: editData.department || null,
        graduation_year: editData.graduationYear ? parseInt(editData.graduationYear) : null,
        interests: editData.interests || [],
        skills: editData.skills || []
      };

      // Remove empty strings and convert to null
      Object.keys(profileData).forEach(key => {
        if (profileData[key] === '' || profileData[key] === undefined) {
          profileData[key] = null;
        }
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/profiles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(profileData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Update local state with saved data
        const updatedUser = {
          ...state.currentUser,
          ...editData
        };
        actions.login(updatedUser);
        setIsEditing(false);
        console.log('Profile updated successfully');
      } else {
        console.error('Failed to update profile:', result.error);
        alert('Failed to update profile: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditData({
      displayName: state.currentUser?.displayName || '',
      bio: state.currentUser?.bio || '',
      email: state.currentUser?.email || '',
      phone: state.currentUser?.phone || '',
      dateOfBirth: state.currentUser?.dateOfBirth || '',
      gender: state.currentUser?.gender || '',
      location: state.currentUser?.location || '',
      university: state.currentUser?.university || '',
      course: state.currentUser?.course || '',
      department: state.currentUser?.department || '',
      graduationYear: state.currentUser?.graduationYear || '',
      interests: state.currentUser?.interests || [],
      skills: state.currentUser?.skills || [],
      socialLinks: state.currentUser?.socialLinks || {}
    });
    setIsEditing(false);
  };

  const addInterest = (interest) => {
    if (interest && !editData.interests.includes(interest)) {
      setEditData({...editData, interests: [...editData.interests, interest]});
    }
  };

  const removeInterest = (interest) => {
    setEditData({...editData, interests: editData.interests.filter(i => i !== interest)});
  };

  const addSkill = (skill) => {
    if (skill && !editData.skills.includes(skill)) {
      setEditData({...editData, skills: [...editData.skills, skill]});
    }
  };

  const removeSkill = (skill) => {
    setEditData({...editData, skills: editData.skills.filter(s => s !== skill)});
  };

  if (!profileUser) return null;

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-start gap-6">
          <img
            src={profileUser.avatar || profileUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`}
            alt={profileUser.displayName || profileUser.display_name}
            className="w-24 h-24 rounded-full object-cover"
          />
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.displayName}
                    onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                    className="text-2xl font-bold bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-foreground">
                    {safeRender(profileUser?.displayName || profileUser?.display_name)}
                  </h1>
                )}
                <p className="text-muted-foreground">@{safeRender(profileUser?.username)}</p>
                
                {/* Quick Stats */}
                <div className="flex gap-4 mt-2">
                  <span className="text-sm text-muted-foreground">
                    <strong className="text-foreground">
                      {(state.posts || []).filter(post => (post.author === profileUser.username || post.username === profileUser.username) && !post.isAnonymous).length}
                    </strong> Posts
                  </span>
                </div>
              </div>
              
              {!isOwnProfile && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      actions.setViewingProfile(null);
                      actions.setCurrentPage('feed');
                    }}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                  >
                    ← Back
                  </button>
                  
                  {!statusLoading && !state.sessionLoading ? (
                    friendshipStatus === 'friends' ? (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2" disabled>
                        <Check className="w-4 h-4" />
                        Connected
                      </button>
                    ) : friendshipStatus === 'request_sent' ? (
                      <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg flex items-center gap-2" disabled>
                        <Clock className="w-4 h-4" />
                        Request Sent
                      </button>
                    ) : friendshipStatus === 'request_received' ? (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2" disabled>
                        <UserPlus className="w-4 h-4" />
                        Respond to Request
                      </button>
                    ) : (
                      <button 
                        onClick={handleSendFriendRequest}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <UserPlus className="w-4 h-4" />
                        {loading ? 'Sending...' : 'Connect'}
                      </button>
                    )
                  ) : (
                    <button className="px-4 py-2 bg-gray-400 text-white rounded-lg flex items-center gap-2" disabled>
                      <Clock className="w-4 h-4 animate-spin" />
                      Loading...
                    </button>
                  )}
                </div>
              )}
              
              {isOwnProfile && (
                <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button onClick={handleCancel} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-2">
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-2">
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
                </div>
              )}
            </div>
            
            {/* Bio */}
            <div className="mb-4">
              {isEditing && isOwnProfile ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                  className="w-full h-20 p-3 bg-secondary/30 border border-border/50 rounded-lg resize-none text-foreground placeholder:text-muted-foreground"
                />
              ) : (
                <p className="text-foreground">{safeRender(profileUser?.bio, "No bio available")}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Personal Info, Academic Info, Interests & Skills inside header */}
        <div className="mt-6 pt-6 border-t border-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Personal Information */}
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Personal Information
              </h3>
              
              <div className="space-y-3 text-sm">
                {isOwnProfile && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({...editData, email: e.target.value})}
                        className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground text-xs"
                      />
                    ) : (
                      <span className="text-foreground">{safeRender(profileUser?.email)}</span>
                    )}
                  </div>
                )}
                
                {isOwnProfile && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        placeholder="Phone number"
                        className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground text-xs"
                      />
                    ) : (
                      <span className="text-foreground">{safeRender(profileUser?.phone)}</span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  {isEditing ? (
                    <input
                      type="date"
                      value={editData.dateOfBirth}
                      onChange={(e) => setEditData({...editData, dateOfBirth: e.target.value})}
                      className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground text-xs"
                    />
                  ) : (
                    <span className="text-foreground">DOB: {safeRender(profileUser?.dateOfBirth)}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <User className="w-3 h-3 text-muted-foreground" />
                  {isEditing ? (
                    <select
                      value={editData.gender}
                      onChange={(e) => setEditData({...editData, gender: e.target.value})}
                      className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground text-xs"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  ) : (
                    <span className="text-foreground">Gender: {safeRender(profileUser?.gender, "Not specified")}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.location}
                      onChange={(e) => setEditData({...editData, location: e.target.value})}
                      placeholder="Location"
                      className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground text-xs"
                    />
                  ) : (
                    <span className="text-foreground">Location: {safeRender(profileUser?.location)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Academic Information
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building className="w-3 h-3 text-muted-foreground" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.university}
                      onChange={(e) => setEditData({...editData, university: e.target.value})}
                      placeholder="University"
                      className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground text-xs"
                    />
                  ) : (
                    <span className="text-foreground">University: {safeRender(profileUser?.university)}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.course}
                      onChange={(e) => setEditData({...editData, course: e.target.value})}
                      placeholder="Course/Major"
                      className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground text-xs"
                    />
                  ) : (
                    <span className="text-foreground">Course: {safeRender(profileUser?.course)}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Building className="w-3 h-3 text-muted-foreground" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.department}
                      onChange={(e) => setEditData({...editData, department: e.target.value})}
                      placeholder="Department"
                      className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground text-xs"
                    />
                  ) : (
                    <span className="text-foreground">Department: {safeRender(profileUser?.department)}</span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.graduationYear}
                      onChange={(e) => setEditData({...editData, graduationYear: e.target.value})}
                      placeholder="Graduation Year"
                      min="2020"
                      max="2030"
                      className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground text-xs"
                    />
                  ) : (
                    <span className="text-foreground">Graduation: {safeRender(profileUser?.graduationYear)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Interests & Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Interests */}
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Interests
              </h3>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {(isEditing ? editData.interests : profileUser.interests || []).map((interest, index) => (
                  <span key={index} className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs flex items-center gap-1">
                    {interest}
                    {isEditing && isOwnProfile && (
                      <button onClick={() => removeInterest(interest)} className="hover:text-destructive">
                        <X className="w-2 h-2" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              
              {isEditing && isOwnProfile && (
                <input
                  type="text"
                  placeholder="Add interest (press Enter)"
                  className="w-full bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground text-xs"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addInterest(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              )}
            </div>

            {/* Skills */}
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/50">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Skills
              </h3>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {(isEditing ? editData.skills : profileUser.skills || []).map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded-full text-xs flex items-center gap-1">
                    {skill}
                    {isEditing && isOwnProfile && (
                      <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                        <X className="w-2 h-2" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              
              {isEditing && isOwnProfile && (
                <input
                  type="text"
                  placeholder="Add skill (press Enter)"
                  className="w-full bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground text-xs"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addSkill(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Posts Section Inside Header */}
        <div className="mt-6 pt-6 border-t border-border bg-secondary/30 rounded-lg p-4 border border-border/50">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Posts ({(state.posts || []).filter(post => 
              (post.author === profileUser.username || post.username === profileUser.username) && !post.isAnonymous
            ).length})
          </h2>
          
          <div className="space-y-4">
            {(state.posts || [])
              .filter(post => (post.author === profileUser.username || post.username === profileUser.username) && !post.isAnonymous)
              .map(post => (
                <PostCard 
                  key={post.id} 
                  post={{
                    ...post,
                    likes: post.likes || 0,
                    comments: post.comments || 0,
                    shares: post.shares || 0,
                    isLiked: post.isLiked || false,
                    displayName: post.displayName || profileUser.displayName || profileUser.display_name,
                    username: post.username || profileUser.username,
                    avatar: post.avatar || profileUser.avatar || profileUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`,
                    timestamp: post.timestamp || post.created_at || new Date()
                  }}
                  onPostDeleted={() => {
                    // Handle post deletion if needed
                  }}
                />
              ))}
            
            {(state.posts || []).filter(post => (post.author === profileUser.username || post.username === profileUser.username) && !post.isAnonymous).length === 0 && (
              <p className="text-muted-foreground text-center py-4 text-sm">No posts yet</p>
            )}
          </div>
        </div>
      </div>

      </div>
  );
};

const Profile = () => {
  return (
    <ErrorBoundary>
      <ProfileContent />
    </ErrorBoundary>
  );
};

export default Profile;
