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
    
    // Get posts without profiles join for now
    let { data, error, count } = await supabase
      .from('posts')
      .select('*', { count: 'exact' })
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
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { title, content, type = 'text', is_anonymous = false, tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Insert post without profiles join first
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        type,
        is_anonymous,
        tags,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Post creation error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Like/unlike post
router.post('/:id/like', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { id } = req.params;

    // Get user from auth header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id);

      res.json({ success: true, liked: false });
    } else {
      // Like
      await supabase
        .from('likes')
        .insert({ post_id: id, user_id: user.id });

      res.json({ success: true, liked: true });
    }

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
