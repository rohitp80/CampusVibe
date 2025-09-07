import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useUserProfile } from '../hooks/useUserProfile.js';
import { safeRender, normalizeProfileData } from '../utils/profileUtils.js';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { useFriends } from '../hooks/useFriends.js';
import FriendRequests from '../components/Notifications/FriendRequests.jsx';
import { 
  User, 
  Users,
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
  const [showFriendsDropdown, setShowFriendsDropdown] = useState(false);
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
  
  // Debug: Log the profileUser data
  console.log('Raw Profile User Data:', rawProfileUser);
  console.log('Normalized Profile User Data:', profileUser);
  console.log('Is Own Profile:', isOwnProfile);
  console.log('Profile Loading:', profileLoading);
  console.log('Profile Error:', profileError);
  
  const isFriend = state.friends?.some(f => f.username === profileUser.username);
  const hasPendingRequest = state.friendRequests?.some(req => 
    req.from === state.currentUser?.username && req.to === profileUser.username
  );
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFriendsDropdown && !event.target.closest('.friends-dropdown')) {
        setShowFriendsDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFriendsDropdown]);
  
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
    <div className="w-full space-y-6">
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
                  <div className="flex gap-3 relative">
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <div className="relative friends-dropdown">
                      <button 
                        onClick={() => setShowFriendsDropdown(!showFriendsDropdown)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Friends ({friends.length})
                      </button>
                      
                      {showFriendsDropdown && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                          <div className="p-4 border-b border-border">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Friends ({friends.length})
                            </h3>
                          </div>
                          <div className="p-2">
                            {friends.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">No friends yet</p>
                            ) : (
                              friends.map((friend) => (
                                <div key={friend.id} className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg">
                                  <img
                                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                                    alt={friend.display_name || friend.username}
                                    className="w-10 h-10 rounded-full"
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{friend.display_name || friend.username}</p>
                                    <p className="text-xs text-muted-foreground">@{friend.username}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
      </div>

      {/* Contact & Personal Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </h3>
          
          <div className="space-y-4">
            {isOwnProfile && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground"
                  />
                ) : (
                  <span className="text-foreground">{safeRender(profileUser?.email)}</span>
                )}
              </div>
            )}
            
            {isOwnProfile && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    placeholder="Phone number"
                    className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground"
                  />
                ) : (
                  <span className="text-foreground">{safeRender(profileUser?.phone)}</span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {isEditing ? (
                <input
                  type="date"
                  value={editData.dateOfBirth}
                  onChange={(e) => setEditData({...editData, dateOfBirth: e.target.value})}
                  className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground"
                />
              ) : (
                <span className="text-foreground">DOB: {safeRender(profileUser?.dateOfBirth)}</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground" />
              {isEditing ? (
                <select
                  value={editData.gender}
                  onChange={(e) => setEditData({...editData, gender: e.target.value})}
                  className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground"
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
            
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              {isEditing ? (
                <input
                  type="text"
                  value={editData.location}
                  onChange={(e) => setEditData({...editData, location: e.target.value})}
                  placeholder="Location"
                  className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground"
                />
              ) : (
                <span className="text-foreground">Location: {safeRender(profileUser?.location)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Academic Info */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Academic Information
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4 text-muted-foreground" />
              {isEditing ? (
                <input
                  type="text"
                  value={editData.university}
                  onChange={(e) => setEditData({...editData, university: e.target.value})}
                  placeholder="University"
                  className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground"
                />
              ) : (
                <span className="text-foreground">University: {safeRender(profileUser?.university)}</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              {isEditing ? (
                <input
                  type="text"
                  value={editData.course}
                  onChange={(e) => setEditData({...editData, course: e.target.value})}
                  placeholder="Course/Major"
                  className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground"
                />
              ) : (
                <span className="text-foreground">Course: {safeRender(profileUser?.course)}</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Building className="w-4 h-4 text-muted-foreground" />
              {isEditing ? (
                <input
                  type="text"
                  value={editData.department}
                  onChange={(e) => setEditData({...editData, department: e.target.value})}
                  placeholder="Department"
                  className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground"
                />
              ) : (
                <span className="text-foreground">Department: {safeRender(profileUser?.department)}</span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              {isEditing ? (
                <input
                  type="number"
                  value={editData.graduationYear}
                  onChange={(e) => setEditData({...editData, graduationYear: e.target.value})}
                  placeholder="Graduation Year"
                  min="2020"
                  max="2030"
                  className="flex-1 bg-secondary/30 border border-border/50 rounded px-2 py-1 text-foreground"
                />
              ) : (
                <span className="text-foreground">Graduation: {safeRender(profileUser?.graduationYear)}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interests & Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5" />
            Interests
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {(isEditing ? editData.interests : profileUser.interests || []).map((interest, index) => (
              <span key={index} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2">
                {interest}
                {isEditing && isOwnProfile && (
                  <button onClick={() => removeInterest(interest)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          
          {isEditing && isOwnProfile && (
            <input
              type="text"
              placeholder="Add interest (press Enter)"
              className="w-full bg-secondary/30 border border-border/50 rounded px-3 py-2 text-foreground"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addInterest(e.target.value);
                  e.target.value = '';
                }
              }}
            />
          )}
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Skills
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {(isEditing ? editData.skills : profileUser.skills || []).map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-secondary/50 text-secondary-foreground rounded-full text-sm flex items-center gap-2">
                {skill}
                {isEditing && isOwnProfile && (
                  <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          
          {isEditing && isOwnProfile && (
            <input
              type="text"
              placeholder="Add skill (press Enter)"
              className="w-full bg-secondary/30 border border-border/50 rounded px-3 py-2 text-foreground"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addSkill(e.target.value);
                  e.target.value = '';
                }
              }}
            />
          )}
        </div>
        
        {/* Tabs Section */}
        <div className="bg-card border border-border rounded-xl mt-6">
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Posts ({(state.posts || []).filter(post => 
                (post.author === profileUser.username || post.username === profileUser.username) && !post.isAnonymous
              ).length})
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'posts' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Posts
                </h2>
                
                <div className="space-y-6">
                  {(state.posts || [])
                    .filter(post => (post.author === profileUser.username || post.username === profileUser.username) && !post.isAnonymous)
                    .map(post => (
                <div key={post.id} className="w-full bg-secondary/30 rounded-lg p-6 border border-border/50">
                  <div className="flex items-start gap-3 w-full">
                    <img
                      src={profileUser.avatar || profileUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`}
                      alt={profileUser.displayName || profileUser.display_name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{profileUser.displayName || profileUser.display_name}</span>
                        <span className="text-muted-foreground text-sm">@{profileUser.username}</span>
                        <span className="text-muted-foreground text-sm">•</span>
                        <span className="text-muted-foreground text-sm">
                          {post.timestamp ? new Date(post.timestamp).toLocaleDateString() : 'Just now'}
                        </span>
                      </div>
                      <p className="text-foreground mb-3 text-base leading-relaxed">{post.content}</p>
                      {post.image && (
                        <img src={post.image} alt="Post" className="rounded-lg max-w-full h-auto mb-2" />
                      )}
                      <div className="flex items-center gap-4 text-muted-foreground text-sm">
                        <span>❤️ {post.likes}</span>
                        <span>💬 {post.comments}</span>
                        <span>🔄 {post.shares}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
            
            {(state.posts || []).filter(post => (post.author === profileUser.username || post.username === profileUser.username) && !post.isAnonymous).length === 0 && (
              <p className="text-muted-foreground text-center py-8">No posts yet</p>
            )}
                </div>
              </div>
            )}

            {activeTab === 'friends' && isOwnProfile && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Friends ({friends.length})
                </h2>
                
                {friends.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No friends yet</p>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {friends.map((friend) => (
                      <div key={friend.id} className="bg-card rounded-lg p-3 border border-border shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <img
                              src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                              alt={friend.display_name || friend.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground text-sm truncate">
                                {friend.display_name || friend.username}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              actions.setViewingProfile({
                                username: friend.username,
                                displayName: friend.display_name,
                                display_name: friend.display_name,
                                avatar_url: friend.avatar_url
                              });
                            }}
                            className="px-4 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-xs font-medium"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
