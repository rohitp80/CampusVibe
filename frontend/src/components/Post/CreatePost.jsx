// ConnectHub - Create Post Component
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { useCreatePost } from '../../hooks/usePosts';
import { moods, communities, postTypes } from '../../data/dummyData.js';
import { supabase } from '../../lib/supabase.js';
import { 
  Image as ImageIcon, 
  Code, 
  Calendar,
  Smile,
  Hash,
  Send,
  X,
  Upload
} from 'lucide-react';

const CreatePost = () => {
  const { state, actions } = useApp();
  const createPostMutation = useCreatePost();
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedType, setSelectedType] = useState(postTypes[0]);
  const [unlockDate, setUnlockDate] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  
  const fileInputRef = useRef(null);
  const moodPickerRef = useRef(null);
  const communityPickerRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moodPickerRef.current && !moodPickerRef.current.contains(event.target)) {
        setShowMoodPicker(false);
      }
      if (communityPickerRef.current && !communityPickerRef.current.contains(event.target)) {
        setShowCommunityPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Please select an image file',
        timestamp: new Date()
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Image size must be less than 5MB',
        timestamp: new Date()
      });
      return;
    }

    setUploading(true);
    
    try {
      // Create preview first
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `post-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('chat-files') // Use existing bucket
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        setImage(file);
        actions.addNotification({
          id: Date.now(),
          type: 'warning',
          message: 'Using local image (storage error)',
          timestamp: new Date()
        });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath);
        
        setImageUrl(publicUrl);
        setImage(file);
        
        actions.addNotification({
          id: Date.now(),
          type: 'success',
          message: 'Image uploaded successfully!',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setImage(file);
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Upload failed, using local image',
        timestamp: new Date()
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    alert('HandleSubmit called!'); // Simple test
    
    console.log('=== POST CREATION STARTED ===');
    console.log('Content:', content);
    console.log('Image preview:', imagePreview);
    console.log('Code snippet:', codeSnippet);
    
    if (!content.trim() && !imagePreview && !codeSnippet) {
      console.log('No content provided, exiting');
      return;
    }
    
    console.log('Getting user session...');
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session);
    
    if (!session?.user) {
      console.log('No session found');
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Please log in to create a post',
        timestamp: new Date()
      });
      return;
    }

    console.log('Getting user profile...');
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .eq('id', session.user.id)
      .single();

    console.log('Profile data:', profile);

    if (!profile) {
      console.log('No profile found');
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: 'User profile not found',
        timestamp: new Date()
      });
      return;
    }

    // Create temporary ID for optimistic update
    const tempId = `temp_${Date.now()}`;
    
    const newPost = {
      id: tempId, // Temporary ID
      userId: selectedType.name === 'Anonymous' ? null : profile.id,
      username: selectedType.name === 'Anonymous' ? 'anonymous' : profile.username,
      author: selectedType.name === 'Anonymous' ? 'anonymous' : profile.username,
      displayName: selectedType.name === 'Anonymous' ? '' : profile.display_name,
      avatar: selectedType.name === 'Anonymous' ? '/api/placeholder/40/40' : profile.avatar_url,
      community: selectedCommunity?.name || 'General',
      mood: selectedMood?.name || 'neutral',
      type: selectedType.name.toLowerCase(),
      content: content.trim(),
      isAnonymous: selectedType.name === 'Anonymous',
      createdAt: new Date().toISOString(), // Use ISO string like database
      ...(imagePreview && { image: imagePreview }),
      ...(imageUrl && { imageUrl: imageUrl }),
      ...(codeSnippet && { codeSnippet }),
      ...(selectedType.name === 'Time Capsule' && unlockDate && {
        unlockDate: new Date(unlockDate),
        isLocked: true
      })
    };
    
    // Add to local state immediately (optimistic update)
    actions.addPost(newPost);
    
    // Save to Supabase database
    try {
      console.log('Attempting to save post to database...');
      console.log('Profile data:', profile);
      console.log('Selected community:', selectedCommunity);
      
      const postData = {
        user_id: selectedType.name === 'Anonymous' ? null : profile.id,
        community_id: selectedCommunity?.id || null,
        type: selectedType.name.toLowerCase(),
        content: content.trim(),
        code_snippet: codeSnippet || null,
        image_url: imageUrl || null,
        mood: selectedMood?.name || null,
        is_anonymous: selectedType.name === 'Anonymous',
        likes: 0,
        comments: 0
      };
      
      console.log('Selected type name:', selectedType.name);
      console.log('Type value (lowercase):', selectedType.name.toLowerCase());
      console.log('Selected mood:', selectedMood?.name);
      console.log('Post data to insert:', postData);
      
      const { data, error } = await supabase
        .from('posts')
        .insert(postData)
        .select(`
          id,
          user_id,
          community_id,
          type,
          content,
          code_snippet,
          image_url,
          mood,
          is_anonymous,
          likes,
          comments,
          created_at,
          updated_at,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          ),
          communities:community_id (
            id,
            name
          )
        `)
        .single();

      console.log('Database response:', { data, error });

      if (error) {
        console.error('Database insert error:', error);
        // Remove the optimistic update on error
        actions.removePost(tempId);
        actions.addNotification({
          id: Date.now(),
          type: 'error',
          message: `Database error: ${error.message}`,
          timestamp: new Date()
        });
      } else {
        console.log('Post saved successfully:', data);
        // Update the existing optimistic post with real database data
        const realPostUpdates = {
          id: data.id, // Replace temp ID with real ID
          userId: data.user_id,
          username: data.is_anonymous ? 'anonymous' : data.profiles?.username,
          author: data.is_anonymous ? 'anonymous' : data.profiles?.username,
          displayName: data.is_anonymous ? '' : data.profiles?.display_name,
          avatar: data.is_anonymous ? '/api/placeholder/40/40' : data.profiles?.avatar_url,
          community: data.communities?.name || 'General',
          likes: data.likes,
          comments: data.comments,
          // Keep the original timestamp from optimistic update
          ...(data.image_url && { imageUrl: data.image_url }),
          ...(data.code_snippet && { codeSnippet: data.code_snippet })
        };
        
        console.log('Updating post with:', realPostUpdates);
        
        // Update the existing post instead of removing and adding
        actions.updatePost(tempId, realPostUpdates);
        
        actions.addNotification({
          id: Date.now(),
          type: 'success',
          message: 'Post created successfully! 🚀',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Database connection error:', error);
      // Remove the optimistic update on error
      actions.removePost(tempId);
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: `Connection error: ${error.message}`,
        timestamp: new Date()
      });
    }
    
    // Reset form
    setContent('');
    setSelectedMood(null);
    setSelectedCommunity(null);
    setSelectedType(postTypes[0]);
    setUnlockDate('');
    setImage(null);
    setImagePreview(null);
    setImageUrl(null);
    setCodeSnippet('');
    setShowCodeEditor(false);
    
    if (!state.isAuthenticated || !content.trim()) {
      actions.addNotification({
        id: Date.now(),
        type: 'post',
        message: 'Post created successfully! 🎉',
        timestamp: new Date()
      });
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    setImageUrl(null);
  };
  
  const isFormValid = () => {
    return (content.trim() || imagePreview || codeSnippet) && 
           (selectedType.name !== 'Time Capsule' || unlockDate);
  };
  
  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6 mb-6">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <img 
            src={state.currentUser.avatar}
            alt={state.currentUser.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              Create a post
            </h3>
            <p className="text-sm text-muted-foreground">
              Share your thoughts with the community
            </p>
          </div>
        </div>
        
        {/* Post Type Selector */}
        <div className="mb-4">
          <div className="flex gap-2 flex-wrap">
            {postTypes.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${selectedType.id === type.id 
                    ? 'bg-primary text-primary-foreground shadow-glow' 
                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70'
                  }
                `}
              >
                {type.name}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {selectedType.description}
          </p>
        </div>
        
        {/* Content Input */}
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              selectedType.name === 'Anonymous' 
                ? "Share your thoughts anonymously..."
                : selectedType.name === 'Time Capsule'
                ? "What do you want to tell your future self?"
                : "What's on your mind?"
            }
            className="w-full h-32 p-4 bg-secondary/30 border border-border/50 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>
        
        {/* Time Capsule Date */}
        {selectedType.name === 'Time Capsule' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Unlock Date
            </label>
            <input
              type="date"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-3 bg-secondary/30 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground"
            />
          </div>
        )}
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-4 relative">
            <img 
              src={imagePreview} 
              alt="Preview"
              className="w-full h-64 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 w-8 h-8 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        
        {/* Code Editor */}
        {showCodeEditor && (
          <div className="mb-4">
            <div className="bg-secondary/30 rounded-lg border border-border/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-b border-border/50">
                <Code className="w-4 h-4 text-hub-primary" />
                <span className="text-sm font-medium text-foreground">Code Snippet</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowCodeEditor(false);
                    setCodeSnippet('');
                  }}
                  className="ml-auto p-1 hover:bg-secondary/50 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="// Enter your code here..."
                className="w-full h-32 p-4 bg-transparent border-none resize-none focus:outline-none font-mono text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}
        
        {/* Tools Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {/* Image Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`
                p-2 rounded-lg transition-colors
                ${uploading 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'hover:bg-secondary/50'
                }
              `}
              title={uploading ? "Uploading..." : "Add Image"}
            >
              {uploading ? (
                <Upload className="w-5 h-5 text-gray-400 animate-spin" />
              ) : (
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {/* Code Snippet */}
            <button
              type="button"
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              className={`p-2 rounded-lg transition-colors ${
                showCodeEditor 
                  ? 'bg-primary/20 text-primary' 
                  : 'hover:bg-secondary/50 text-muted-foreground'
              }`}
              title="Add Code Snippet"
            >
              <Code className="w-5 h-5" />
            </button>
            
            {/* Mood Picker */}
            <div className="relative" ref={moodPickerRef}>
              <button
                type="button"
                onClick={() => setShowMoodPicker(!showMoodPicker)}
                className={`p-2 rounded-lg transition-colors ${
                  selectedMood 
                    ? 'bg-primary/20 text-primary' 
                    : 'hover:bg-secondary/50 text-muted-foreground'
                }`}
                title="Select Mood"
              >
                {selectedMood ? (
                  <span className="text-lg">{selectedMood.emoji}</span>
                ) : (
                  <Smile className="w-5 h-5" />
                )}
              </button>
              
              {showMoodPicker && (
                <div className="absolute bottom-12 left-0 bg-card border border-border rounded-xl shadow-elevated p-4 z-10 animate-scale-in">
                  <div className="grid grid-cols-4 gap-2 w-48">
                    {moods.map(mood => (
                      <button
                        key={mood.id}
                        type="button"
                        onClick={() => {
                          setSelectedMood(mood);
                          setShowMoodPicker(false);
                        }}
                        className="p-2 hover:bg-secondary/50 rounded-lg transition-colors text-center"
                        title={mood.name}
                      >
                        <span className="text-lg block">{mood.emoji}</span>
                        <span className="text-xs text-muted-foreground capitalize">{mood.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Community Picker */}
            <div className="relative" ref={communityPickerRef}>
              <button
                type="button"
                onClick={() => setShowCommunityPicker(!showCommunityPicker)}
                className={`p-2 rounded-lg transition-colors ${
                  selectedCommunity 
                    ? 'bg-primary/20 text-primary' 
                    : 'hover:bg-secondary/50 text-muted-foreground'
                }`}
                title="Select Community"
              >
                <Hash className="w-5 h-5" />
              </button>
              
              {showCommunityPicker && (
                <div className="absolute bottom-12 left-0 bg-card border border-border rounded-xl shadow-elevated p-4 z-10 animate-scale-in w-64">
                  <div className="space-y-2">
                    {communities.map(community => (
                      <button
                        key={community.id}
                        type="button"
                        onClick={() => {
                          setSelectedCommunity(community);
                          setShowCommunityPicker(false);
                        }}
                        className="w-full flex items-center gap-3 p-2 hover:bg-secondary/50 rounded-lg transition-colors text-left"
                      >
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: community.color }}
                        />
                        <div className="min-w-0 flex-1">
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
              )}
            </div>
          </div>
          
          {/* Selected Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedCommunity && (
              <span className="text-xs bg-secondary/50 px-2 py-1 rounded-full text-secondary-foreground truncate max-w-[120px] sm:max-w-none">
                #{selectedCommunity.name}
              </span>
            )}
            {selectedMood && (
              <span className="text-xs bg-secondary/50 px-2 py-1 rounded-full text-secondary-foreground flex items-center gap-1 flex-shrink-0">
                <span>{selectedMood.emoji}</span>
                <span className="capitalize">{selectedMood.name}</span>
              </span>
            )}
          </div>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isFormValid()}
          className={`
            w-full px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2
            ${isFormValid()
              ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-glow'
              : 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          <Send className="w-4 h-4" />
          {selectedType.name === 'Time Capsule' 
            ? 'Create Time Capsule' 
            : selectedType.name === 'Anonymous' 
            ? 'Post Anonymously'
            : 'Share Post'
          }
        </button>
        
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </form>
    </div>
  );
};

export default CreatePost;
