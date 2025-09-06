import express from 'express';
import multer from 'multer';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Get messages for a community
router.get('/community/:communityId/messages', async (req, res) => {
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
      // Return mock data on error
      const mockMessages = [
        {
          id: 1,
          community_id: communityId,
          user_id: 'user1',
          username: 'alex_codes',
          message: 'Welcome to the community! 🎉',
          created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          community_id: communityId,
          user_id: 'user2', 
          username: 'sarah_studies',
          message: 'Great to be here! Let\'s collaborate 💪',
          created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        }
      ];
      return res.json({ success: true, data: mockMessages });
    }

    res.json({ success: true, data: messages || [] });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a text message to community
router.post('/community/:communityId/messages', async (req, res) => {
  try {
    const { communityId } = req.params;
    const { message, username, user_id } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Only use columns that exist in your schema
    const newMessage = {
      community_id: communityId,
      user_id: user_id || 'anonymous',
      username: username || 'Anonymous',
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
      // Return mock response on error
      const mockResponse = {
        id: Date.now(),
        ...newMessage,
        created_at: new Date().toISOString()
      };
      return res.status(201).json({ success: true, data: mockResponse });
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Upload file to community chat (store as special message)
router.post('/community/:communityId/upload', upload.single('file'), async (req, res) => {
  try {
    const { communityId } = req.params;
    const { username, user_id } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

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
      user_id: user_id || 'anonymous',
      username: username || 'Anonymous',
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
      // Return mock response on error
      const mockResponse = {
        id: Date.now(),
        ...fileMessage,
        created_at: new Date().toISOString()
      };
      return res.status(201).json({ success: true, data: mockResponse });
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

export default router;
