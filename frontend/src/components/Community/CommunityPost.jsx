import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { supabase } from '../../lib/supabase.js';
import CreatePost from '../Post/CreatePost.jsx';
import PostCard from '../Post/PostCard.jsx';
import { Users, MessageCircle, TrendingUp, Clock, Hash } from 'lucide-react';

const CommunityPost = ({ community }) => {
  const { actions } = useApp();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [isJoined, setIsJoined] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [canPost, setCanPost] = useState(false);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        checkMembership(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Check if user is a member and get role
  const checkMembership = async (userId) => {
    try {
      const { data } = await supabase
        .from('community_members')
        .select('id, role, can_post')
        .eq('community_id', community.id)
        .eq('user_id', userId)
        .single();

      if (data) {
        setIsJoined(true);
        setUserRole(data.role);
        // Admin can always post OR member with can_post permission
        setCanPost(data.role === 'admin' || (data.role === 'member' && data.can_post === true));
      } else {
        setIsJoined(false);
        setUserRole(null);
        setCanPost(false);
      }
    } catch (error) {
      console.error('Error checking membership:', error);
      setIsJoined(false);
      setUserRole(null);
      setCanPost(false);
    }
  };

  // Real-time subscription for new posts
  useEffect(() => {
    if (!community?.id) return;

    const subscription = supabase
      .channel(`community_posts:${community.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          if (payload.new.community_id === community.id) {
            // Fetch complete post with profile data
            const { data } = await supabase
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
              .eq('id', payload.new.id)
              .single();

            if (data) {
              const newPost = {
                id: data.id,
                userId: data.user_id,
                username: data.is_anonymous ? 'anonymous' : data.profiles?.username || 'User',
                displayName: data.is_anonymous ? 'Anonymous' : data.profiles?.display_name || 'User',
                avatar: data.is_anonymous ? '/api/placeholder/40/40' : data.profiles?.avatar_url || '/api/placeholder/40/40',
                community: community.name,
                mood: data.mood || 'neutral',
                type: data.type,
                content: data.content,
                isAnonymous: data.is_anonymous,
                timestamp: new Date(data.created_at + 'Z'),
                likes: data.likes || 0,
                comments: data.comments || 0,
                shares: 0,
                isLiked: false,
                ...(data.image_url && { imageUrl: data.image_url }),
                ...(data.code_snippet && { codeSnippet: data.code_snippet })
              };

              // Add to posts if not from current user (avoid duplicates from optimistic updates)
              setPosts(prev => {
                const exists = prev.find(p => p.id === newPost.id);
                if (!exists) {
                  return [newPost, ...prev];
                }
                return prev;
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [community?.id]);

  // Real-time subscription for membership changes
  useEffect(() => {
    if (!community?.id || !currentUserId) return;

    const subscription = supabase
      .channel(`community_membership:${community.id}:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members'
        },
        (payload) => {
          if (payload.new?.community_id === community.id && payload.new?.user_id === currentUserId) {
            // User joined
            setIsJoined(true);
            setUserRole(payload.new.role);
            setCanPost(payload.new.role === 'admin' || (payload.new.role === 'member' && payload.new.can_post === true));
          } else if (payload.old?.community_id === community.id && payload.old?.user_id === currentUserId) {
            // User left
            setIsJoined(false);
            setUserRole(null);
            setCanPost(false);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [community?.id, currentUserId]);

  // Load community posts
  useEffect(() => {
    loadCommunityPosts();
  }, [community.id, sortBy]);

  const loadCommunityPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
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
          is_chat_message,
          profiles:user_id (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('community_id', community.id)
        .or('is_chat_message.is.null,is_chat_message.eq.false'); // Exclude chat messages

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'popular') {
        query = query.order('likes', { ascending: false });
      } else if (sortBy === 'discussed') {
        query = query.order('comments', { ascending: false });
      }

      const { data, error } = await query;

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
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Error loading community posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Join/Leave community with immediate feedback
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
        // Optimistic update - leave
        setIsJoined(false);
        setCanPost(false);
        
        await supabase
          .from('community_members')
          .delete()
          .eq('community_id', community.id)
          .eq('user_id', currentUserId);

        actions.addNotification({
          id: Date.now(),
          type: 'info',
          message: `Left ${community.name} community`,
          timestamp: new Date()
        });
      } else {
        // Optimistic update - join
        setIsJoined(true);
        setUserRole('member');
        setCanPost(false); // Default to false until admin approves
        
        await supabase
          .from('community_members')
          .insert({
            community_id: community.id,
            user_id: currentUserId,
            role: 'member',
            can_post: false
          });

        actions.addNotification({
          id: Date.now(),
          type: 'success',
          message: `Joined ${community.name} community! 🎉`,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error toggling membership:', error);
      // Revert optimistic update on error
      checkMembership(currentUserId);
    }
  };

  const sortOptions = [
    { key: 'recent', label: 'Recent', icon: Clock },
    { key: 'popular', label: 'Popular', icon: TrendingUp },
    { key: 'discussed', label: 'Most Discussed', icon: MessageCircle }
  ];

  return (
    <div className="space-y-6">
      {/* Create Post (only for members with posting permission) */}
      {isJoined && canPost && (
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <CreatePost 
            defaultCommunity={community} 
            onPostCreated={loadCommunityPosts}
          />
        </div>
      )}

      {/* No posting permission message */}
      {isJoined && !canPost && (
        <div className="bg-card rounded-xl border border-border shadow-card p-6 text-center">
          <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">
            Posting Restricted
          </h3>
          <p className="text-xs text-muted-foreground">
            Only admins and approved members can create posts in this community.
          </p>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="ml-3 text-muted-foreground">Loading posts...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-card p-12 text-center">
            <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No posts yet
            </h3>
            <p className="text-muted-foreground mb-4">
              {!isJoined 
                ? 'Join this community to see posts and discussions.'
                : canPost
                ? 'Be the first to start a discussion in this community!'
                : 'No posts yet. Only admins and approved members can create posts.'
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
          posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};

export default CommunityPost;
