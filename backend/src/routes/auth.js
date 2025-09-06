import express from 'express';
import { supabase } from '../lib/supabase.js';

const router = express.Router();

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required', code: 'MISSING_FIELDS' }
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name }
      }
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message, code: error.code || 'SIGNUP_ERROR' }
      });
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INTERNAL_ERROR' }
    });
  }
});

// Sign in
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email and password are required', code: 'MISSING_FIELDS' }
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message, code: error.code || 'SIGNIN_ERROR' }
      });
    }

    res.json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INTERNAL_ERROR' }
    });
  }
});

// Sign out
router.post('/signout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.message, code: error.code || 'SIGNOUT_ERROR' }
      });
    }

    res.json({
      success: true,
      message: 'Signed out successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INTERNAL_ERROR' }
    });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: { message: 'No authorization header', code: 'UNAUTHORIZED' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({
        success: false,
        error: { message: error.message, code: 'UNAUTHORIZED' }
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: { message: err.message, code: 'INTERNAL_ERROR' }
    });
  }
});

export default router;
