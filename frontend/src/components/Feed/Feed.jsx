// ConnectHub - Main Feed Component
import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { usePosts } from '../../hooks/usePosts';
import CreatePost from '../Post/CreatePost.jsx';
import PostCard from '../Post/PostCard.jsx';
import { Filter, TrendingUp, Clock, Flame } from 'lucide-react';

const Feed = () => {
  const { state, actions } = useApp();
  const [sortBy, setSortBy] = React.useState('recent');
  
  // Fetch posts from API
  const { data: apiPosts, isLoading, error, refetch } = usePosts();
  
  // Combine API posts with local posts
  const allPosts = React.useMemo(() => {
    const localPosts = state.filteredPosts || [];
    const backendPosts = apiPosts?.data || [];
    
    // Convert backend posts to frontend format
    const formattedBackendPosts = backendPosts.map(post => {
      // Convert UTC timestamp to local time properly
      const utcTime = new Date(post.created_at + 'Z'); // Add 'Z' to ensure UTC parsing
      
      return {
        id: post.id,
        userId: post.user_id,
        username: post.profiles?.username || 'User',
        displayName: post.profiles?.display_name || 'User',
        avatar: post.profiles?.avatar_url || '/api/placeholder/40/40',
        community: post.communities?.name || 'General',
        mood: post.mood || 'neutral',
        type: post.type,
        content: post.content,
        isAnonymous: post.is_anonymous,
        timestamp: utcTime, // Use properly converted UTC time
        likes: post.likes || 0,
        comments: post.comments || 0,
        shares: 0,
        isLiked: false, // Will be updated by individual PostCard components
        ...(post.image_url && { image: post.image_url }),
        ...(post.code_snippet && { codeSnippet: post.code_snippet })
      };
    });
    
    // Merge and deduplicate
    const combined = [...formattedBackendPosts, ...localPosts];
    const unique = combined.filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    );
    
    return unique;
  }, [state.filteredPosts, apiPosts]);
  
  const sortedPosts = React.useMemo(() => {
    let posts = [...allPosts];
    
    switch (sortBy) {
      case 'popular':
        posts.sort((a, b) => (b.likes + b.comments + (b.shares || 0)) - (a.likes + a.comments + (a.shares || 0)));
        break;
      case 'trending':
        // Sort by engagement rate in the last 24 hours
        posts.sort((a, b) => {
          const aRecent = a.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000);
          const bRecent = b.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000);
          if (aRecent && !bRecent) return -1;
          if (!aRecent && bRecent) return 1;
          return (b.likes + b.comments) - (a.likes + a.comments);
        });
        break;
      case 'recent':
      default:
        posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    return posts;
  }, [allPosts, sortBy]);
  
  const clearFilter = () => {
    actions.filterByCommunity(null);
  };
  
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Feed Header */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {state.selectedCommunity ? `#${state.selectedCommunity.name || state.selectedCommunity}` : 'Your Feed'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {state.selectedCommunity 
                ? `Posts from ${state.selectedCommunity.name || state.selectedCommunity} community`
                : 'Latest posts from your network'
              }
            </p>
          </div>
          
          {state.selectedCommunity && (
            <button
              onClick={clearFilter}
              className="px-4 py-2 bg-secondary/50 hover:bg-secondary/70 rounded-lg text-sm font-medium transition-colors"
            >
              Show All
            </button>
          )}
        </div>
        
        {/* Sort Options */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {[
              { id: 'recent', label: 'Recent', icon: Clock },
              { id: 'popular', label: 'Popular', icon: TrendingUp },
              { id: 'trending', label: 'Trending', icon: Flame }
            ].map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setSortBy(option.id)}
                  className={`
                    flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${sortBy === option.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70'
                    }
                  `}
                >
                  <Icon className="w-3 h-3" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Community Filter Banner */}
      {state.selectedCommunity && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary" />
              <div>
                <h3 className="font-semibold">#{state.selectedCommunity.name || state.selectedCommunity}</h3>
                <p className="text-sm text-muted-foreground">
                  Showing posts from this community • {sortedPosts.length} posts
                </p>
              </div>
            </div>
            <button
              onClick={() => actions.selectCommunity(null)}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              Show All Posts
            </button>
          </div>
        </div>
      )}
      
      {/* Create Post */}
      <CreatePost />
      
      {/* Posts */}
      <div className="space-y-6">
        {isLoading && (
          <div className="bg-card rounded-xl border border-border shadow-card p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-card rounded-xl border border-border shadow-card p-12 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Failed to load posts
            </h3>
            <p className="text-muted-foreground mb-4">
              {error.message || 'Something went wrong'}
            </p>
          </div>
        )}
        
        {!isLoading && !error && sortedPosts.length > 0 ? (
          sortedPosts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onPostDeleted={() => refetch()}
            />
          ))
        ) : !isLoading && !error ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-12 text-center">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No posts yet
            </h3>
            <p className="text-muted-foreground mb-4">
              {state.selectedCommunity 
                ? `No posts in #${state.selectedCommunity} community yet.`
                : 'Be the first to share something with the community!'
              }
            </p>
            {state.selectedCommunity && (
              <button
                onClick={clearFilter}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                View All Posts
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Feed;