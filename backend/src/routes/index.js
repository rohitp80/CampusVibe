import express from 'express';
import authRoutes from './auth.js';
import postRoutes from './posts.js';
import profileRoutes from './profiles.js';

const router = express.Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/profiles', profileRoutes);

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
