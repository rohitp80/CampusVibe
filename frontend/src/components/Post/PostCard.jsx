// ConnectHub - Post Card Component
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
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

const PostCard = ({ post }) => {
  const { actions } = useApp();
  const [showComments, setShowComments] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMore, setShowMore] = useState(false);
  
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
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
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
        <img 
          src={post.isAnonymous ? '/api/placeholder/40/40' : post.avatar}
          alt={post.displayName}
          className="w-10 h-10 rounded-full object-cover"
        />
        
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
        
        <button className="p-2 hover:bg-secondary/50 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
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
            <span className="text-sm font-medium">{post.comments}</span>
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
          {/* Display actual comments */}
          {post.commentsList && post.commentsList.length > 0 && post.commentsList.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <img 
                src={`https://picsum.photos/seed/${comment.author}/32/32`}
                alt={comment.author}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1 bg-secondary/30 rounded-lg px-3 py-2">
                <p className="text-sm text-foreground">{comment.text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {comment.author} • {new Date(comment.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {/* Static comments for demo */}
          <div className="flex gap-3">
            <img 
              src="https://picsum.photos/seed/commenter1/32/32" 
              alt="Commenter"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 bg-secondary/30 rounded-lg px-3 py-2">
              <p className="text-sm text-foreground">Great post! Really helpful insights.</p>
              <p className="text-xs text-muted-foreground mt-1">2h ago</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <img 
              src="https://picsum.photos/seed/commenter2/32/32" 
              alt="Commenter"
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1 bg-secondary/30 rounded-lg px-3 py-2">
              <p className="text-sm text-foreground">Thanks for sharing! 🙌</p>
              <p className="text-xs text-muted-foreground mt-1">1h ago</p>
            </div>
          </div>
          
          {/* Add Comment Input */}
          <div className="flex gap-3 pt-2">
            <img 
              src="https://picsum.photos/seed/currentuser/32/32" 
              alt="You"
              className="w-8 h-8 rounded-full"
            />
            <input
              type="text"
              placeholder="Write a comment..."
              className="flex-1 bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  actions.addComment(post.id, e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;