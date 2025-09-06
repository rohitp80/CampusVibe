import express from 'express';
import authRoutes from './auth.js';
import postRoutes from './posts.js';
import profileRoutes from './profiles.js';
import chatRoutes from './chat.js';
import searchRoutes from './search.js';
import communityRoutes from './community.js';

const router = express.Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/profiles', profileRoutes);
router.use('/chat', chatRoutes);
router.use('/search', searchRoutes);
router.use('/community', communityRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CampusConnect API v1.0.0',
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      profiles: '/api/profiles',
      chat: '/api/chat',
      community: '/api/community'
    }
  });
});

export default router;
