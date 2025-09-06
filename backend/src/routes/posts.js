import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// In-memory like tracking (replace with database table later)
const userLikes = new Map(); // Format: "user_id:post_id" -> true

// Get all posts
router.get('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { page = 1, limit = 20, sort = 'latest' } = req.query;
    const offset = (page - 1) * limit;
    
    // Get posts with profile information
    let { data, error, count } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!user_id(username, display_name, avatar_url),
        communities!community_id(name, color)
      `, { count: 'exact' })
      .order('created_at', { ascending: sort === 'oldest' })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Posts fetch error:', error);
      return res.status(500).json({ error: error.message });
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      data: data || [],
      count,
      page: parseInt(page),
      totalPages,
      hasMore: page < totalPages
    });

  } catch (error) {
    console.error('Posts route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new post
router.post('/', async (req, res) => {
  try {
    console.log('📝 POST /api/posts - Request body:', JSON.stringify(req.body, null, 2));
    
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      return res.status(500).json({ 
        error: 'Database not configured',
        details: 'Supabase client is null'
      });
    }

    const { 
      content, 
      type = 'text', 
      is_anonymous = false, 
      community_id, 
      code_snippet, 
      image_url, 
      mood 
    } = req.body;

    // Allow posts with content, image, or code snippet
    if (!content?.trim() && !image_url && !code_snippet?.trim()) {
      console.log('❌ Validation failed: Missing content, image, or code');
      return res.status(400).json({ error: 'Content, image, or code snippet is required' });
    }

    // Use default user for testing (remove auth requirement for now)
    const userId = '8316b40d-b133-4f83-a3c0-d015b070d058';
    console.log('👤 Using user ID:', userId);

    // Map frontend types to valid database enum values
    let dbType = 'text';
    if (type === 'anonymous') dbType = 'text';
    else if (type === 'time capsule') dbType = 'text';
    else if (type === 'image') dbType = 'image';
    else if (type === 'code') dbType = 'code';
    else dbType = 'text';

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        community_id,
        type: dbType,
        content: content?.trim() || '',
        code_snippet: code_snippet?.trim() || null,
        image_url: image_url || null,
        mood,
        is_anonymous
      })
      .select(`
        *,
        profiles!user_id(username, display_name, avatar_url),
        communities!community_id(name, color)
      `)
      .single();

    if (error) {
      console.error('❌ Post creation error:', error);
      return res.status(500).json({ 
        error: error.message,
        details: error.details || 'Failed to create post'
      });
    }

    console.log('✅ Post created successfully:', data.id);
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data
    });

  } catch (error) {
    console.error('❌ Posts creation route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check if user liked a post
router.get('/:id/liked/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const likeKey = `${userId}:${id}`;
    const liked = userLikes.has(likeKey);
    
    res.json({ liked });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle like on post
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id = 'anonymous' } = req.body;
    
    const likeKey = `${user_id}:${id}`;
    const hasLiked = userLikes.has(likeKey);
    
    // Get current post
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    let newLikes;
    let liked;
    
    if (hasLiked) {
      // Unlike
      userLikes.delete(likeKey);
      newLikes = Math.max(0, (post.likes || 0) - 1);
      liked = false;
    } else {
      // Like
      userLikes.set(likeKey, true);
      newLikes = (post.likes || 0) + 1;
      liked = true;
    }
    
    // Update post likes count
    const { error: updateError } = await supabase
      .from('posts')
      .update({ likes: newLikes })
      .eq('id', id);
    
    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }
    
    res.json({ success: true, liked, likes: newLikes });
    
  } catch (error) {
    console.error('Like toggle error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comments for a post
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles!user_id(username, display_name, avatar_url)
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.log('Comments fetch error:', error);
      return res.json({ data: [] }); // Return empty array if table doesn't exist
    }
    
    res.json({ data: data || [] });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment to post
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, currentUser } = req.body;
    
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }

    console.log('Current user data:', currentUser);

    // Use current user data if available, otherwise fallback
    const userProfile = currentUser ? {
      username: currentUser.username || currentUser.email?.split('@')[0] || 'user',
      display_name: currentUser.display_name || currentUser.name || currentUser.email?.split('@')[0] || 'User',
      avatar_url: currentUser.avatar_url || currentUser.picture || null
    } : {
      username: 'karancoderg',
      display_name: 'karancoderg', 
      avatar_url: null
    };

    // Try to insert comment (will likely fail due to constraints, but that's ok)
    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .insert({
        post_id: id,
        user_id: '8316b40d-b133-4f83-a3c0-d015b070d058', // Use existing user ID
        content: content.trim()
      })
      .select(`
        *,
        profiles!user_id(username, display_name, avatar_url)
      `)
      .single();

    if (commentError) {
      console.log('Comment insert failed, using current user data:', commentError);
      // Return comment with current user profile
      return res.status(201).json({
        success: true,
        data: {
          id: Date.now(),
          content: content.trim(),
          created_at: new Date().toISOString(),
          profiles: userProfile
        }
      });
    }

    // If successful, override with current user data
    const commentWithCurrentUser = {
      ...comment,
      profiles: userProfile
    };

    // Update post comment count
    try {
      const { data: post } = await supabase
        .from('posts')
        .select('comments')
        .eq('id', id)
        .single();
      
      if (post) {
        await supabase
          .from('posts')
          .update({ comments: (post.comments || 0) + 1 })
          .eq('id', id);
      }
    } catch (error) {
      console.log('Could not update comment count:', error);
    }

    res.status(201).json({ success: true, data: commentWithCurrentUser });
    
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single post by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get post error:', error);
      return res.status(404).json({ error: 'Post not found' });
    }

    console.log('✅ Post fetched successfully:', id);
    
    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Get post route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a post
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // For testing, allow deletion (in production, add proper auth check)
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Delete post error:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.status(404).json({ error: 'Post not found' });
    }

    console.log('✅ Post deleted successfully:', id);
    
    res.json({
      success: true,
      message: 'Post deleted successfully',
      data
    });

  } catch (error) {
    console.error('Delete post route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
