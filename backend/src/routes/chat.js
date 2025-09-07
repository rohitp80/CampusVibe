import express from 'express';
import { authenticateUser } from '../lib/auth.js';

const router = express.Router();

// In-memory message storage (simple solution)
const messages = new Map();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Send direct message
router.post('/direct', async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user.id;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const conversationKey = [senderId, receiverId].sort().join('-');
    
    if (!messages.has(conversationKey)) {
      messages.set(conversationKey, []);
    }
    
    const newMessage = {
      id: Date.now(),
      message: message.trim(),
      sender_id: senderId,
      receiver_id: receiverId,
      created_at: new Date().toISOString()
    };
    
    messages.get(conversationKey).push(newMessage);
    
    res.json({ success: true, data: newMessage });
  } catch (error) {
    console.error('Send direct message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversation between two users
router.get('/direct/:friendId', async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    const conversationKey = [userId, friendId].sort().join('-');
    const conversationMessages = messages.get(conversationKey) || [];
    
    res.json({ success: true, data: conversationMessages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

export default router;
