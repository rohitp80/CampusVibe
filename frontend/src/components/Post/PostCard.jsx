// ConnectHub - Post Card Component
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { supabase } from '../../lib/supabase.js';
import DefaultAvatar from '../ui/DefaultAvatar';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Lock,
  Calendar,
  Code,
  Volume2,
  VolumeX,
  Play,
  Pause
} from 'lucide-react';
import { moods } from '../../data/dummyData.js';

const PostCard = ({ post, onPostDeleted }) => {
  const { actions, state } = useApp();
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Load comment count on mount
  useEffect(() => {
    const loadCommentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        if (!error && count !== null) {
          setCommentCount(count);
        }
      } catch (error) {
        console.error('Error loading comment count:', error);
      }
    };
    
    loadCommentCount();
  }, [post.id]);
  
  // Load comments when showComments is toggled
  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments();
    }
  }, [showComments]);

  // Real-time subscription for comments using broadcast
  useEffect(() => {
    if (!showComments) return;

    console.log('Setting up real-time subscription for post:', post.id);

    const subscription = supabase
      .channel(`post_comments:${post.id}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on('broadcast', { event: 'new_comment' }, (payload) => {
        console.log('Broadcast comment received:', payload);
        
        if (payload.payload.post_id === post.id) {
          const newComment = {
            ...payload.payload,
            timestamp: new Date(payload.payload.timestamp) // Convert ISO string back to Date
          };
          console.log('Adding broadcast comment to UI:', newComment);
          
          setComments(prev => {
            // Check if comment already exists to avoid duplicates
            const exists = prev.find(c => c.id === newComment.id);
            if (exists) {
              console.log('Comment already exists, skipping');
              return prev;
            }
            console.log('Adding new comment to list');
            return [...prev, newComment];
          });
          setCommentCount(prev => prev + 1);
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from real-time comments');
      subscription.unsubscribe();
    };
  }, [showComments, post.id]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          content,
          created_at,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading comments:', error);
      } else {
        const formattedComments = data.map(comment => ({
          id: comment.id,
          content: comment.content,
          timestamp: new Date(comment.created_at + 'Z'), // Handle UTC properly
          username: comment.profiles?.username || 'User',
          displayName: comment.profiles?.display_name || 'User',
          avatar: comment.profiles?.avatar_url || '/api/placeholder/32/32'
        }));
        setComments(formattedComments);
        setCommentCount(data.length); // Set count to actual number of comments from DB
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Submit new comment with broadcast
  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting || !currentUserId) return;

    setIsSubmitting(true);
    
    // Get current user profile for optimistic update
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name, avatar_url')
      .eq('id', currentUserId)
      .single();

    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: newComment.trim()
        })
        .select('id, content, created_at')
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        actions.addNotification({
          id: Date.now(),
          type: 'error',
          message: 'Failed to add comment',
          timestamp: new Date()
        });
      } else {
        // Create comment object for broadcast
        const commentForBroadcast = {
          id: data.id,
          content: data.content,
          timestamp: new Date().toISOString(), // Use current time as ISO string
          username: profile?.username || 'You',
          displayName: profile?.display_name || 'You',
          avatar: profile?.avatar_url || '/api/placeholder/32/32',
          user_id: currentUserId,
          post_id: post.id
        };

        // Broadcast to all subscribers
        const channel = supabase.channel(`post_comments:${post.id}`);
        await channel.send({
          type: 'broadcast',
          event: 'new_comment',
          payload: commentForBroadcast
        });

        console.log('Comment broadcasted:', commentForBroadcast);

        setNewComment('');
        actions.addNotification({
          id: Date.now(),
          type: 'success',
          message: 'Comment added!',
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Failed to add comment',
        timestamp: new Date()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch comments when comments section is opened
  React.useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments();
    }
  }, [showComments]);

  // Close options menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptionsMenu) {
        const optionsMenu = event.target.closest('.options-menu');
        const moreButton = event.target.closest('.more-button');
        
        if (!optionsMenu && !moreButton) {
          setShowOptionsMenu(false);
        }
      }
    };
    
    if (showOptionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOptionsMenu]);

  const mood = moods.find(m => m.name === post.mood);
  
  const [isLiked, setIsLiked] = React.useState(post.isLiked || false);
  const [likeCount, setLikeCount] = React.useState(post.likes || 0);
  const [isLiking, setIsLiking] = React.useState(false);

  // Check if user has liked this post on component mount
  React.useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const userId = 'anonymous'; // Use same user ID as in like requests
        const response = await fetch(`http://localhost:3000/api/posts/${post.id}/liked/${userId}`);
        if (response.ok) {
          const result = await response.json();
          setIsLiked(result.liked);
        }
      } catch (error) {
        console.error('Failed to check like status:', error);
      }
    };
    
    checkLikeStatus();
  }, [post.id]);

  const handleLike = async () => {
    if (isLiking) return; // Prevent double clicks
    
    setIsLiking(true);
    const wasLiked = isLiked;
    
    // Optimistic update
    setIsLiked(!wasLiked);
    setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
    
    try {
      const response = await fetch(`http://localhost:3000/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ user_id: 'anonymous' }) // For now, use anonymous
      });
      
      if (response.ok) {
        const result = await response.json();
        setLikeCount(result.likes);
        setIsLiked(result.liked);
        
        actions.addNotification({
          id: Date.now(),
          type: 'success',
          message: result.liked ? 'Post liked!' : 'Post unliked!',
          timestamp: new Date()
        });
      } else {
        // Revert on error
        setIsLiked(wasLiked);
        setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('Like failed:', error);
      // Revert on error
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
      
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Failed to toggle like',
        timestamp: new Date()
      });
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleShare = () => {
    actions.addNotification({
      id: Date.now(),
      type: 'share',
      message: 'Post shared successfully!',
      timestamp: new Date()
    });
  };
  
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) { // Less than 1 hour
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInSeconds < 86400) { // Less than 24 hours
      const diffInHours = Math.floor(diffInSeconds / 3600);
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInSeconds / 86400);
      return `${diffInDays}d ago`;
    }
  };
  
  const unlockTimeCapsule = () => {
    actions.unlockTimeCapsule(post.id);
    actions.addNotification({
      id: Date.now(),
      type: 'unlock',
      message: 'Time capsule unlocked! 🎉',
      timestamp: new Date()
    });
  };
  
  return (
    <div className="bg-card rounded-xl border border-border shadow-card hover-lift p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        {post.isAnonymous ? (
          <DefaultAvatar size="w-10 h-10" />
        ) : post.avatar ? (
          <img 
            src={post.avatar}
            alt={post.displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <DefaultAvatar size="w-10 h-10" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground truncate max-w-[150px] sm:max-w-none">
              {post.isAnonymous ? 'Anonymous' : post.displayName}
            </h3>
            {!post.isAnonymous && (
              <span className="text-sm text-muted-foreground truncate max-w-[100px] sm:max-w-none">
                @{post.username}
              </span>
            )}
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {formatTimeAgo(post.timestamp)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs bg-secondary/50 px-2 py-1 rounded-full text-secondary-foreground truncate max-w-[120px] sm:max-w-none">
              #{post.community}
            </span>
            {mood && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-sm">{mood.emoji}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {mood.name}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="more-button p-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
          
          {showOptionsMenu && (
            <div className="options-menu absolute right-0 top-10 bg-card border border-border rounded-lg shadow-elevated p-2 z-10 min-w-[150px]">
              <button
                onClick={() => {
                  const postUrl = `${window.location.origin}/post/${post.id}`;
                  navigator.clipboard.writeText(postUrl).then(() => {
                    actions.addNotification({
                      id: Date.now(),
                      type: 'success',
                      message: 'Post link copied to clipboard!',
                      timestamp: new Date()
                    });
                  }).catch(() => {
                    actions.addNotification({
                      id: Date.now(),
                      type: 'error',
                      message: 'Failed to copy link',
                      timestamp: new Date()
                    });
                  });
                  setShowOptionsMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 rounded transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => {
                  console.log('Save post clicked for:', post.id);
                  console.log('Current savedPosts:', state.savedPosts);
                  
                  const isAlreadySaved = state.savedPosts.some(p => p.id === post.id);
                  console.log('Is already saved:', isAlreadySaved);
                  
                  if (isAlreadySaved) {
                    console.log('Unsaving post...');
                    actions.unsavePost(post.id);
                    actions.addNotification({
                      id: Date.now(),
                      type: 'info',
                      message: 'Post removed from saved!',
                      timestamp: new Date()
                    });
                  } else {
                    console.log('Saving post...');
                    actions.savePost(post);
                    actions.addNotification({
                      id: Date.now(),
                      type: 'success',
                      message: 'Post saved successfully!',
                      timestamp: new Date()
                    });
                  }
                  setShowOptionsMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 rounded transition-colors"
              >
                {state.savedPosts.some(p => p.id === post.id) ? 'Unsave Post' : 'Save Post'}
              </button>
              {/* Delete option - only show for user's own posts */}
              {(post.userId === state.currentUser?.id || post.user_id === '8316b40d-b133-4f83-a3c0-d015b070d058') && (
                <button
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this post?')) {
                      try {
                        const response = await fetch(`http://localhost:3000/api/posts/${post.id}`, {
                          method: 'DELETE'
                        });
                        
                        if (response.ok) {
                          actions.deletePost(post.id);
                          if (onPostDeleted) onPostDeleted(post.id);
                          actions.addNotification({
                            id: Date.now(),
                            type: 'success',
                            message: 'Post deleted successfully!',
                            timestamp: new Date()
                          });
                        } else {
                          throw new Error('Failed to delete post');
                        }
                      } catch (error) {
                        console.error('Delete failed:', error);
                        actions.addNotification({
                          id: Date.now(),
                          type: 'error',
                          message: 'Failed to delete post',
                          timestamp: new Date()
                        });
                      }
                    }
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 rounded transition-colors text-red-600"
                >
                  Delete Post
                </button>
              )}
              <button
                onClick={() => {
                  actions.addNotification({
                    id: Date.now(),
                    type: 'info',
                    message: 'Post reported',
                    timestamp: new Date()
                  });
                  setShowOptionsMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 rounded transition-colors text-red-600"
              >
                Report Post
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Time Capsule Lock Overlay */}
      {post.type === 'timecapsule' && post.isLocked && (
        <div className="bg-gradient-to-br from-primary/20 to-hub-secondary/20 rounded-xl p-6 mb-4 text-center border border-primary/30">
          <Lock className="w-8 h-8 text-primary mx-auto mb-3 animate-pulse-glow" />
          <h4 className="font-semibold text-foreground mb-2">Time Capsule Locked</h4>
          <p className="text-sm text-muted-foreground mb-3">
            This post will unlock on {post.unlockDate.toLocaleDateString()}
          </p>
          {post.unlockDate <= new Date() ? (
            <button
              onClick={unlockTimeCapsule}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Unlock Now
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">
              {Math.ceil((post.unlockDate - new Date()) / (1000 * 60 * 60 * 24))} days remaining
            </p>
          )}
        </div>
      )}
      
      {/* Content */}
      {(!post.isLocked || post.type !== 'timecapsule') && (
        <>
          {/* Text Content */}
          <div className="mb-4">
            <p className="text-foreground leading-relaxed">
              {showMore || post.content.length <= 200 
                ? post.content 
                : `${post.content.substring(0, 200)}...`
              }
              {post.content.length > 200 && (
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="text-primary hover:underline ml-2 text-sm"
                >
                  {showMore ? 'Show less' : 'Show more'}
                </button>
              )}
            </p>
          </div>
          
          {/* Code Snippet */}
          {post.codeSnippet && (
            <div className="mb-4 bg-secondary/30 rounded-lg border border-border/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 border-b border-border/50">
                <Code className="w-4 h-4 text-hub-primary" />
                <span className="text-sm font-medium text-foreground">Code Snippet</span>
              </div>
              <pre className="p-4 text-sm text-foreground overflow-x-auto">
                <code>{post.codeSnippet}</code>
              </pre>
            </div>
          )}
          
          {/* Image */}
          {post.image && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img 
                src={post.image} 
                alt="Post content"
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}
          
          {/* Voice Note */}
          {post.type === 'voice' && (
            <div className="mb-4 bg-gradient-to-r from-hub-primary/10 to-hub-secondary/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="w-4 h-4 text-hub-primary" />
                    <span className="text-sm font-medium text-foreground">Voice Note</span>
                    <span className="text-xs text-muted-foreground">2:34</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary rounded-full transition-all duration-300"
                      style={{ width: isPlaying ? '60%' : '0%' }}
                    />
                  </div>
                </div>
                
                <button className="p-2 hover:bg-secondary/50 rounded-lg transition-colors">
                  {isPlaying ? (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
              ${isLiked 
                ? 'text-red-500 hover:bg-red-50' 
                : 'text-muted-foreground hover:text-red-500 hover:bg-red-50'
              }
              ${isLiking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Heart 
              className={`w-4 h-4 transition-transform ${
                isLiked ? 'fill-red-500 text-red-500 scale-110' : ''
              } ${isLiking ? 'animate-pulse' : ''}`} 
            />
            <span className="text-sm font-medium">{likeCount}</span>
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{commentCount}</span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">{post.shares}</span>
          </button>
        </div>
      </div>
      
      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-slide-up">
          {/* Loading State */}
          {loadingComments && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-2 text-sm text-muted-foreground">Loading comments...</span>
            </div>
          )}
          
          {/* Real Comments */}
          {!loadingComments && comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <img 
                src={comment.avatar}
                alt={comment.displayName}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 bg-secondary/30 rounded-lg px-3 py-2">
                <p className="text-sm text-foreground">{comment.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {comment.displayName} • {formatTimeAgo(comment.timestamp)}
                </p>
              </div>
            </div>
          ))}
          
          {/* No Comments Message */}
          {!loadingComments && comments.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
            </div>
          )}
          
          {/* Add Comment Input */}
          <div className="flex gap-3 pt-2">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=current-user"
              alt="You"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmitComment();
                  }
                }}
                disabled={isSubmitting}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;