import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
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
  Bell
} from 'lucide-react';

const Profile = () => {
  const { state, actions } = useApp();
  const [isEditing, setIsEditing] = useState(false);
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

  const handleSave = () => {
    const updatedUser = {
      ...state.currentUser,
      ...editData
    };
    actions.login(updatedUser);
    setIsEditing(false);
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

  if (!state.currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-start gap-6">
          <img
            src={state.currentUser.avatar}
            alt={state.currentUser.displayName}
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
                    {state.currentUser.displayName}
                  </h1>
                )}
                <p className="text-muted-foreground">@{state.currentUser.username}</p>
              </div>
              
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
            </div>
            
            {/* Bio */}
            <div className="mb-4">
              {isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                  className="w-full h-20 p-3 bg-secondary/30 border border-border/50 rounded-lg resize-none text-foreground placeholder:text-muted-foreground"
                />
              ) : (
                <p className="text-foreground">{state.currentUser.bio || "No bio available"}</p>
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
                <span className="text-foreground">{state.currentUser.email}</span>
              )}
            </div>
            
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
                <span className="text-foreground">{state.currentUser.phone || "Not provided"}</span>
              )}
            </div>
            
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
                <span className="text-foreground">{state.currentUser.dateOfBirth || "Not provided"}</span>
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
                <span className="text-foreground">{state.currentUser.gender || "Not specified"}</span>
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
                <span className="text-foreground">{state.currentUser.location || "Not provided"}</span>
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
                <span className="text-foreground">{state.currentUser.university || "Not provided"}</span>
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
                <span className="text-foreground">{state.currentUser.course || "Not provided"}</span>
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
                <span className="text-foreground">{state.currentUser.department || "Not provided"}</span>
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
                <span className="text-foreground">{state.currentUser.graduationYear || "Not provided"}</span>
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
            {(state.currentUser.interests || []).map((interest, index) => (
              <span key={index} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm flex items-center gap-2">
                {interest}
                {isEditing && (
                  <button onClick={() => removeInterest(interest)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          
          {isEditing && (
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
            {(state.currentUser.skills || []).map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-secondary/50 text-secondary-foreground rounded-full text-sm flex items-center gap-2">
                {skill}
                {isEditing && (
                  <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
          
          {isEditing && (
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
      </div>
    </div>
  );
};

export default Profile;
