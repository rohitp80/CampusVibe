import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://demo.supabase.co') {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  } catch (error) {
    console.warn('⚠️  Supabase initialization failed:', error.message);
  }
} else {
  console.log('⚠️  Running in demo mode - Supabase not configured');
}

export { supabase };

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
