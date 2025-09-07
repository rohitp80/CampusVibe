import express from 'express';
import { supabase } from '../lib/supabase.js';

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
    const { 
      display_name, 
      bio, 
      phone,
      date_of_birth,
      gender,
      location,
      university, 
      course, 
      department,
      graduation_year,
      year,
      interests,
      skills
    } = req.body;
    
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
    if (display_name !== undefined) updateData.display_name = display_name;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
    if (gender !== undefined) updateData.gender = gender;
    if (location !== undefined) updateData.location = location;
    if (university !== undefined) updateData.university = university;
    if (course !== undefined) updateData.course = course;
    if (department !== undefined) updateData.department = department;
    if (graduation_year !== undefined) updateData.graduation_year = graduation_year;
    if (year !== undefined) updateData.year = year;
    if (interests !== undefined) updateData.interests = interests;
    if (skills !== undefined) updateData.skills = skills;
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

    // Get profile with email from auth.users join
    let { data, error } = await supabase
      .from('profiles')
      .select(`
        id, 
        username, 
        display_name, 
        avatar_url, 
        bio, 
        email,
        phone,
        date_of_birth,
        gender,
        location,
        university,
        course,
        department,
        graduation_year,
        year,
        interests,
        skills,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: { 
          message: 'Profile not found', 
          code: 'NOT_FOUND' 
        }
      });
    } else if (error) {
      throw error;
    }

    // If email is null in profiles, try to get it from auth.users
    if (!data.email) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(id);
        if (authUser?.user?.email) {
          data.email = authUser.user.email;
        }
      } catch (authErr) {
        console.log('Could not fetch email from auth.users:', authErr.message);
      }
    }

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INTERNAL_ERROR' }
    });
  }
});

export default router;
