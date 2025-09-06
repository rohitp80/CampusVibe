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
        profiles (
          full_name,
          username,
          avatar_url
        )
      `, { count: 'exact' })
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // If profiles table doesn't exist, get posts only
    if (error && error.message.includes('does not exist')) {
      const result = await supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });
      
      data = result.data;
      error = result.error;
      count = result.count;
    }

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message, code: 'FETCH_ERROR' }
      });
    }

    res.json({
      success: true,
      data,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INTERNAL_ERROR' }
    });
  }
});

// Create new post
router.post('/', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const { title, content, type = 'text', is_anonymous = false, tags = [] } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authorization required', code: 'UNAUTHORIZED' }
      });
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title and content are required', code: 'MISSING_FIELDS' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token', code: 'UNAUTHORIZED' }
      });
    }

    // Try to insert with profiles join, fallback to basic insert
    let { data, error } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        type,
        is_anonymous,
        tags,
        author_id: user.id
      })
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .single();

    // If profiles table doesn't exist, insert without join
    if (error && error.message.includes('does not exist')) {
      const result = await supabase
        .from('posts')
        .insert({
          title,
          content,
          type,
          is_anonymous,
          tags,
          author_id: user.id
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message, code: 'CREATE_ERROR' }
      });
    }

    res.status(201).json({
      success: true,
      data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INTERNAL_ERROR' }
    });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try with profiles join first
    let { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('id', id)
      .single();

    // Fallback to posts only if profiles doesn't exist
    if (error && error.message.includes('does not exist')) {
      const result = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      return res.status(404).json({
        success: false,
        error: { message: 'Post not found', code: 'NOT_FOUND' }
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INTERNAL_ERROR' }
    });
  }
});

// Like/unlike post
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authorization required', code: 'UNAUTHORIZED' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token', code: 'UNAUTHORIZED' }
      });
    }

    // Check if likes table exists and if already liked
    const { data: existingLike, error: likeError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single();

    // If likes table doesn't exist, just return success
    if (likeError && likeError.message.includes('does not exist')) {
      return res.json({
        success: true,
        data: { liked: true, message: 'Likes table not yet created' }
      });
    }

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      res.json({
        success: true,
        data: { liked: false }
      });
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: id,
          user_id: user.id
        });

      if (error) throw error;

      res.json({
        success: true,
        data: { liked: true }
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INTERNAL_ERROR' }
    });
  }
});

export default router;
