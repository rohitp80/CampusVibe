import express from 'express';
import multer from 'multer';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to check community membership
const checkMembership = async (req, res, next) => {
  try {
    const { communityId } = req.params;
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is member of community using direct query
    const { data: membership, error: membershipError } = await supabase
      .from('community_members')
      .select('role')
      .eq('community_id', communityId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ error: 'Must be a community member to access chat' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Membership check error:', error);
    res.status(500).json({ error: 'Failed to verify membership' });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, documents, and archives are allowed'));
    }
  }
});

// Get messages for a community (PROTECTED - members only)
router.get('/community/:communityId/messages', checkMembership, async (req, res) => {
  try {
    const { communityId } = req.params;
    
    // Fetch from Supabase using your actual schema (only existing columns)
    const { data: messages, error } = await supabase
      .from('community_messages')
      .select('id, community_id, user_id, username, message, created_at')
      .eq('community_id', communityId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('Supabase error:', error);
      // Return empty array on error for members
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data: messages || [] });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a text message to community (PROTECTED - members only)
router.post('/community/:communityId/messages', checkMembership, async (req, res) => {
  try {
    const { communityId } = req.params;
    const { message } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get user profile to get proper username
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', req.user.id)
      .single();

    // Determine username to display
    const displayName = profile?.display_name || 
                       profile?.username || 
                       req.user.email.split('@')[0];

    // Use authenticated user info
    const newMessage = {
      community_id: communityId,
      user_id: req.user.id,
      username: displayName,
      message: message.trim()
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('community_messages')
      .insert([newMessage])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Upload file to community chat (PROTECTED - members only)
router.post('/community/:communityId/upload', checkMembership, upload.single('file'), async (req, res) => {
  try {
    const { communityId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user profile to get proper username
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', req.user.id)
      .single();

    // Determine username to display
    const displayName = profile?.display_name || 
                       profile?.username || 
                       req.user.email.split('@')[0];

    const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
    
    // Store file info in the message field as JSON
    const fileInfo = {
      type: 'file',
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      fileSize: req.file.size
    };

    const fileMessage = {
      community_id: communityId,
      user_id: req.user.id,
      username: displayName,
      message: `📎 ${req.file.originalname} | ${JSON.stringify(fileInfo)}`
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('community_messages')
      .insert([fileMessage])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

export default router;
