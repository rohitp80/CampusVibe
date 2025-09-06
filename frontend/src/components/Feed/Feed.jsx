// ConnectHub - Main Feed Component
import React from 'react';
import { useApp } from '../../context/AppContext.jsx';
import CreatePost from '../Post/CreatePost.jsx';
import PostCard from '../Post/PostCard.jsx';
import { Filter, TrendingUp, Clock, Flame } from 'lucide-react';

const Feed = () => {
  const { state, actions } = useApp();
  const [sortBy, setSortBy] = React.useState('recent');
  
  const sortedPosts = React.useMemo(() => {
    let posts = [...state.filteredPosts];
    
    switch (sortBy) {
      case 'popular':
        posts.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares));
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
        posts.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    return posts;
  }, [state.filteredPosts, sortBy]);
  
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
              {state.selectedCommunity ? `#${state.selectedCommunity}` : 'Your Feed'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {state.selectedCommunity 
                ? `Posts from ${state.selectedCommunity} community`
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
          <Filter className="w-4 h-4 text-muted-foreground" />
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
      
      {/* Create Post */}
      <CreatePost />
      
      {/* Posts */}
      <div className="space-y-6">
        {sortedPosts.length > 0 ? (
          sortedPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
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
        )}
      </div>
      
      {/* Loading State */}
      {state.isLoading && (
        <div className="bg-card rounded-xl border border-border shadow-card p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading more posts...</p>
        </div>
      )}
    </div>
  );
};

export default Feed;