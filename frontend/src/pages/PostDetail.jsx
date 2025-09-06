import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import PostCard from '../components/Post/PostCard.jsx';
import { ArrowLeft } from 'lucide-react';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const findPost = async () => {
      console.log('Looking for post ID:', postId);
      console.log('Local posts:', state.posts);
      console.log('Filtered posts:', state.filteredPosts);
      
      // First try to find in local state
      let foundPost = state.posts.find(p => p.id === postId) || 
                     state.filteredPosts?.find(p => p.id === postId);

      if (foundPost) {
        console.log('Found post locally:', foundPost);
        setPost(foundPost);
        setLoading(false);
        return;
      }

      console.log('Post not found locally, fetching from API...');
      // If not found locally, fetch from API
      try {
        const response = await fetch(`http://localhost:3000/api/posts/${postId}`);
        console.log('API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API response data:', data);
          
          // Transform API data to match PostCard format
          const transformedPost = {
            id: data.data.id,
            content: data.data.content,
            author: data.data.profiles?.display_name || data.data.profiles?.username || 'Anonymous User',
            username: data.data.profiles?.username || 'anonymous_user',
            timestamp: new Date(data.data.created_at), // Date object, not ISO string
            likes: data.data.likes || 0,
            comments: data.data.comments || 0,
            shares: 0,
            isLiked: false,
            isAnonymous: data.data.is_anonymous || false,
            ...(data.data.image_url && { image: data.data.image_url }),
            ...(data.data.code_snippet && { codeSnippet: data.data.code_snippet }),
            mood: data.data.mood,
            community: data.data.community_id,
            type: data.data.type || 'text'
          };
          
          console.log('Transformed post:', transformedPost);
          setPost(transformedPost);
        } else {
          console.log('API response not ok');
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    findPost();
  }, [postId, state.posts, state.filteredPosts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Post not found</h1>
          <p className="text-muted-foreground mb-4">The post you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <PostCard post={post} />
      </div>
    </div>
  );
};

export default PostDetail;
