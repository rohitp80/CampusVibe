import express from 'express';
import { supabase } from '../lib/supabase.js';
import { authenticateUser } from '../lib/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Send friend request
router.post('/request', async (req, res) => {
  try {
    const { receiverUsername } = req.body;
    const senderId = req.user?.id;

    if (!senderId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get receiver's user ID from username
    const { data: receiverProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', receiverUsername)
      .single();

    if (profileError || !receiverProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    const receiverId = receiverProfile.id;

    // Check if users are already friends
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user1_id.eq.${senderId},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${senderId})`);

    if (existingFriendship && existingFriendship.length > 0) {
      return res.status(400).json({ error: 'Already friends' });
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('id, status')
      .eq('sender_id', senderId)
      .eq('receiver_id', receiverId);

    if (existingRequest && existingRequest.length > 0) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Create friend request
    const { data: request, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get incoming friend requests
router.get('/requests/incoming', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: requests, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        status,
        created_at,
        sender:profiles!friend_requests_sender_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data: requests || [] });
  } catch (error) {
    console.error('Get incoming requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get outgoing friend requests
router.get('/requests/outgoing', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: requests, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        status,
        created_at,
        receiver:profiles!friend_requests_receiver_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('sender_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data: requests || [] });
  } catch (error) {
    console.error('Get outgoing requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept friend request
router.post('/request/:requestId/accept', async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Update request status
    const { data: request, error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('receiver_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject friend request
router.post('/request/:requestId/reject', async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Update request status
    const { data: request, error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('receiver_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel friend request
router.delete('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Delete request
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId)
      .eq('sender_id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get friends list
router.get('/list', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        id,
        created_at,
        user1:profiles!friendships_user1_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        ),
        user2:profiles!friendships_user2_id_fkey(
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Transform to get the friend (not the current user)
    const friends = (friendships || []).map(friendship => {
      const friend = friendship.user1.id === userId ? friendship.user2 : friendship.user1;
      return {
        ...friend,
        friendshipId: friendship.id,
        friendsSince: friendship.created_at
      };
    });

    res.json({ success: true, data: friends });
  } catch (error) {
    console.error('Get friends list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check friendship status
router.get('/status/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get other user's ID
    const { data: otherProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (profileError || !otherProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otherId = otherProfile.id;

    // Check if friends
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user1_id.eq.${userId},user2_id.eq.${otherId}),and(user1_id.eq.${otherId},user2_id.eq.${userId})`);

    if (friendship && friendship.length > 0) {
      return res.json({ success: true, status: 'friends' });
    }

    // Check for pending requests
    const { data: outgoingRequest } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('sender_id', userId)
      .eq('receiver_id', otherId)
      .eq('status', 'pending');

    if (outgoingRequest && outgoingRequest.length > 0) {
      return res.json({ success: true, status: 'request_sent' });
    }

    const { data: incomingRequest } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('sender_id', otherId)
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (incomingRequest && incomingRequest.length > 0) {
      return res.json({ success: true, status: 'request_received' });
    }

    res.json({ success: true, status: 'none' });
  } catch (error) {
    console.error('Check friendship status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
