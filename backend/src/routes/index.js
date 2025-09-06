import express from 'express';
import authRoutes from './auth.js';
import postRoutes from './posts.js';
import profileRoutes from './profiles.js';
import chatRoutes from './chat.js';
import searchRoutes from './search.js';

const router = express.Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/profiles', profileRoutes);
router.use('/chat', chatRoutes);
router.use('/search', searchRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'CampusConnect API v1.0.0',
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      profiles: '/api/profiles'
    }
  });
});

export default router;
