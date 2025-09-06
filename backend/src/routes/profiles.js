import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

// Get current user profile
router.get('/', async (req, res) => {
  try {
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

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: { message: 'Profile not found', code: 'NOT_FOUND' }
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

// Update user profile
router.put('/', async (req, res) => {
  try {
    const { full_name, bio, college, course, year } = req.body;
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

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (bio !== undefined) updateData.bio = bio;
    if (college !== undefined) updateData.college = college;
    if (course !== undefined) updateData.course = course;
    if (year !== undefined) updateData.year = year;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message, code: 'UPDATE_ERROR' }
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

// Get profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, bio, college, course, year, avatar_url, created_at')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: { message: 'Profile not found', code: 'NOT_FOUND' }
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

export default router;
