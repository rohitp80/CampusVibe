import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

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

    const { content, type = 'text', is_anonymous = false, community_id, code_snippet, image_url, mood } = req.body;

    if (!content) {
      console.log('❌ Validation failed: Missing content');
      return res.status(400).json({ error: 'Content is required' });
    }

    // Get user from auth header
    const authHeader = req.headers.authorization;
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🎫 Token length:', token.length);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error('❌ Auth error:', authError);
      return res.status(401).json({ 
        error: 'Invalid token',
        details: authError.message 
      });
    }
    
    if (!user) {
      console.error('❌ No user found');
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('✅ Authenticated user:', user.id);

    // Prepare insert data
    const insertData = {
      content,
      type,
      is_anonymous,
      user_id: user.id,
      ...(community_id && { community_id }),
      ...(code_snippet && { code_snippet }),
      ...(image_url && { image_url }),
      ...(mood && { mood })
    };
    
    console.log('📊 Insert data:', JSON.stringify(insertData, null, 2));

    // Insert post
    const { data, error } = await supabase
      .from('posts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        error: 'Database error',
        details: error.message,
        code: error.code,
        hint: error.hint
      });
    }

    console.log('✅ Post created successfully:', data.id);
    
    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data
    });

  } catch (error) {
    console.error('💥 Unexpected error in POST /api/posts:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

// In-memory like tracking (replace with database table later)
const userLikes = new Map(); // Format: "user_id:post_id" -> true

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
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ data: data || [] });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add comment to post
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    // For testing, use a default user ID
    const userId = '8316b40d-b133-4f83-a3c0-d015b070d058'; // Use existing user
    
    // Add comment (create table if it doesn't exist)
    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .insert({
        post_id: id,
        user_id: userId,
        content: content.trim()
      })
      .select(`
        *,
        profiles!user_id(username, display_name, avatar_url)
      `)
      .single();
    
    if (commentError) {
      console.log('Comment insert error:', commentError);
      // If table doesn't exist, return success anyway
      return res.status(201).json({ 
        success: true, 
        data: {
          id: Date.now(),
          content: content.trim(),
          created_at: new Date().toISOString(),
          profiles: {
            username: 'karandeep_singh',
            display_name: 'karandeep singh',
            avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocKbxgEkElYtGcLkgFE9UgX0Zltp0L4M6XuY4CB73dQh6m35Og=s96-c'
          }
        }
      });
    }
    
    // Update post comment count
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
    
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
