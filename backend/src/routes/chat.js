import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get user's chat rooms
router.get('/rooms', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        chat_participants!inner(user_id),
        messages(content, created_at)
      `)
      .eq('chat_participants.user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new chat room
router.post('/rooms', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { name, type = 'direct', participant_id } = req.body;

    // Create chat room
    const { data: chatRoom, error: roomError } = await supabase
      .from('chat_rooms')
      .insert([{ name, type }])
      .select()
      .single();

    if (roomError) throw roomError;

    // Add participants
    const participants = [
      { chat_id: chatRoom.id, user_id: user.id },
      ...(participant_id ? [{ chat_id: chatRoom.id, user_id: participant_id }] : [])
    ];

    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert(participants);

    if (participantError) throw participantError;

    res.status(201).json({ success: true, data: chatRoom });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a chat room
router.get('/rooms/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:user_id(username, display_name, avatar_url)
      `)
      .eq('chat_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/rooms/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        chat_id: id,
        user_id: user.id,
        content
      }])
      .select(`
        *,
        profiles:user_id(username, display_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a community
router.get('/community/:communityId/messages', async (req, res) => {
  try {
    const { communityId } = req.params;
    
    // Mock messages for now
    const mockMessages = [
      {
        id: 1,
        community_id: communityId,
        user_id: 'user1',
        username: 'alex_codes',
        message: 'Welcome to the community!',
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        community_id: communityId,
        user_id: 'user2', 
        username: 'sarah_studies',
        message: 'Great to be here!',
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
      }
    ];
    
    res.json({ success: true, data: mockMessages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message to community
router.post('/community/:communityId/messages', async (req, res) => {
  try {
    const { communityId } = req.params;
    const { message, username } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Mock message response
    const newMessage = {
      id: Date.now(),
      community_id: communityId,
      user_id: 'current-user',
      username: username || 'You',
      message: message.trim(),
      created_at: new Date().toISOString()
    };
    
    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
