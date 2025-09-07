import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase.js';
import CreatePost from '../components/Post/CreatePost.jsx';
import PostCard from '../components/Post/PostCard.jsx';
import { Hash, Users, MessageCircle, Plus, Search, TrendingUp, ArrowLeft, Clock } from 'lucide-react';

const Communities = () => {
  const { state, actions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewingCommunity, setViewingCommunity] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Check membership when viewing a community
  useEffect(() => {
    if (viewingCommunity && currentUserId) {
      checkMembership();
    }
  }, [viewingCommunity, currentUserId]);

  const checkMembership = async () => {
    try {
      const { data } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', viewingCommunity.id)
        .eq('user_id', currentUserId)
        .single();
      
      setIsJoined(!!data);
    } catch (error) {
      setIsJoined(false);
    }
  };

  const loadCommunityPosts = async (community) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
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
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', community.id)
        .order('created_at', { ascending: false });

      if (!error) {
        const formattedPosts = data.map(post => ({
          id: post.id,
          userId: post.user_id,
          username: post.is_anonymous ? 'anonymous' : post.profiles?.username || 'User',
          displayName: post.is_anonymous ? 'Anonymous' : post.profiles?.display_name || 'User',
          avatar: post.is_anonymous ? '/api/placeholder/40/40' : post.profiles?.avatar_url || '/api/placeholder/40/40',
          community: community.name,
          mood: post.mood || 'neutral',
          type: post.type,
          content: post.content,
          isAnonymous: post.is_anonymous,
          timestamp: new Date(post.created_at + 'Z'),
          likes: post.likes || 0,
          comments: post.comments || 0,
          shares: 0,
          isLiked: false,
          ...(post.image_url && { imageUrl: post.image_url }),
          ...(post.code_snippet && { codeSnippet: post.code_snippet })
        }));
        setCommunityPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Error loading community posts:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleViewCommunity = (community) => {
    setViewingCommunity(community);
    loadCommunityPosts(community);
  };

  const handleBackToCommunities = () => {
    setViewingCommunity(null);
    setCommunityPosts([]);
    setIsJoined(false);
  };

  const toggleMembership = async () => {
    if (!currentUserId) {
      actions.addNotification({
        id: Date.now(),
        type: 'error',
        message: 'Please log in to join communities',
        timestamp: new Date()
      });
      return;
    }

    try {
      if (isJoined) {
        // Leave community
        await supabase
          .from('community_members')
          .delete()
          .eq('community_id', viewingCommunity.id)
          .eq('user_id', currentUserId);

        setIsJoined(false);
        actions.addNotification({
          id: Date.now(),
          type: 'info',
          message: `Left ${viewingCommunity.name} community`,
          timestamp: new Date()
        });
      } else {
        // Join community
        await supabase
          .from('community_members')
          .insert({
            community_id: viewingCommunity.id,
            user_id: currentUserId,
            role: 'member'
          });

        setIsJoined(true);
        actions.addNotification({
          id: Date.now(),
          type: 'success',
          message: `Joined ${viewingCommunity.name} community! 🎉`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error toggling membership:', error);
    }
  };

  const categories = ['all', 'Technology', 'Academic', 'Sports', 'Arts', 'Social'];

  const filteredCommunities = state.communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || community.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleJoinCommunity = (communityId) => {
    actions.joinCommunity(communityId);
    actions.addNotification({
      id: Date.now(),
      type: 'success',
      message: 'Successfully joined community!',
      timestamp: new Date()
    });
  };

  const handleLeaveCommunity = (communityId) => {
    actions.leaveCommunity(communityId);
    actions.addNotification({
      id: Date.now(),
      type: 'info',
      message: 'Left community',
      timestamp: new Date()
    });
  };

  const handleSelectCommunity = (community) => {
    actions.selectCommunity(community);
    actions.addNotification({
      id: Date.now(),
      type: 'info',
      message: `Viewing posts from ${community.name}`,
      timestamp: new Date()
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {viewingCommunity ? (
        // Community Posts View
        <div className="space-y-6">
          {/* Community Header */}
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={handleBackToCommunities}
                className="w-10 h-10 rounded-lg hover:bg-secondary/50 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: viewingCommunity.color }}
              >
                #
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">#{viewingCommunity.name}</h1>
                <p className="text-muted-foreground">{viewingCommunity.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{viewingCommunity.member_count || 0} members</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{communityPosts.length} posts</span>
                </div>
                {viewingCommunity.category && (
                  <span className="px-2 py-1 bg-secondary/50 rounded-md text-xs">
                    {viewingCommunity.category}
                  </span>
                )}
              </div>

              <button
                onClick={toggleMembership}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isJoined
                    ? 'bg-secondary/50 hover:bg-secondary/70 text-foreground'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {isJoined ? 'Leave' : 'Join'}
              </button>
            </div>
          </div>

          {/* Create Post (only for members) */}
          {isJoined && (
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <CreatePost 
                defaultCommunity={viewingCommunity} 
                onPostCreated={() => loadCommunityPosts(viewingCommunity)}
              />
            </div>
          )}

          {/* Posts */}
          <div className="space-y-6">
            {loadingPosts ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="ml-3 text-muted-foreground">Loading posts...</span>
              </div>
            ) : communityPosts.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-card p-12 text-center">
                <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No posts yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isJoined 
                    ? 'Be the first to start a discussion in this community!'
                    : 'Join this community to see posts and start discussions.'
                  }
                </p>
                {!isJoined && (
                  <button
                    onClick={toggleMembership}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Join Community
                  </button>
                )}
              </div>
            ) : (
              communityPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        </div>
      ) : (
        // Communities List View
        <>
          {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Communities</h1>
            <p className="text-muted-foreground">Discover and join communities that match your interests</p>
          </div>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Community
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Community Banner */}
      {state.selectedCommunity && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hash className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-semibold">Currently viewing: {state.selectedCommunity.name}</h3>
                <p className="text-sm text-muted-foreground">Posts are filtered to this community</p>
              </div>
            </div>
            <button
              onClick={() => actions.selectCommunity(null)}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All Posts
            </button>
          </div>
        </div>
      )}

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCommunities.map(community => (
          <div key={community.id} className="bg-card rounded-xl border border-border shadow-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: community.color }}
                >
                  {community.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    {community.name}
                    {community.trending && (
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">{community.category}</p>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-4 text-sm">{community.description}</p>

            <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{community.memberCount} members</span>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                <span>Active</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {community.tags?.map(tag => (
                <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleViewCommunity(community)}
                className="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 text-sm font-medium"
              >
                View Posts
              </button>
              {community.isJoined ? (
                <button
                  onClick={() => handleLeaveCommunity(community.id)}
                  className="px-4 py-2 border border-border text-muted-foreground rounded-lg hover:bg-destructive hover:text-destructive-foreground text-sm font-medium"
                >
                  Leave
                </button>
              ) : (
                <button
                  onClick={() => handleJoinCommunity(community.id)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
                >
                  Join
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredCommunities.length === 0 && (
        <div className="text-center py-12">
          <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No communities found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default Communities;
