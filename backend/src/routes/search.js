import express from 'express';
import { supabase } from '../server.js';

const router = express.Router();

// Search users by username
router.get('/users', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, university')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(10);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
