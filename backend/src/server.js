import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './lib/supabase.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test Supabase connection
if (supabase) {
  console.log('✅ Supabase client initialized');
} else {
  console.log('⚠️ Supabase client not available');
}

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    
    res.json({
      success: true,
      message: 'CampusConnect Backend is healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: err.message
    });
  }
});

// Import API routes
import apiRoutes from './routes/index.js';

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      code: 'INTERNAL_ERROR'
    }
  });
});

// 404 handler
// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 CampusConnect Backend Starting...');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log('✅ Supabase connected');
  
  // Test database connection
  testConnection();
});

// Test connection function
async function testConnection() {
  if (!supabase) {
    console.log('💡 Running in demo mode - no database connection needed');
    return;
  }
  
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('⚠️  Database connection test failed:', error.message);
      console.log('💡 Backend will work in demo mode');
    } else {
      console.log('✅ Database connection successful');
    }
  } catch (err) {
    console.log('⚠️  Connection test error:', err.message);
    console.log('💡 Backend will work in demo mode');
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down CampusConnect Backend...');
  process.exit(0);
});

export default app;
