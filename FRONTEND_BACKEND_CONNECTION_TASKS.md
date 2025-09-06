# Frontend-Backend Connection Tasks

## Phase 1: Core Integration Setup (3-4 days)

### Task 1.1: Backend API Server Setup
**Priority: Critical | Time: 1 day**

- [ ] **1.1.1**: Convert backend to proper Express server
  ```javascript
  // src/server.js - Replace current index.js
  import express from 'express';
  import cors from 'cors';
  import dotenv from 'dotenv';
  
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  ```
  **Files**: `src/server.js`, update `package.json` scripts

- [ ] **1.1.2**: Create API route structure
  ```javascript
  // src/routes/index.js
  import express from 'express';
  const router = express.Router();
  
  router.use('/auth', authRoutes);
  router.use('/posts', postRoutes);
  router.use('/profiles', profileRoutes);
  
  export default router;
  ```
  **Files**: `src/routes/index.js`, `src/routes/auth.js`, `src/routes/posts.js`

### Task 1.2: Frontend API Client Setup
**Priority: Critical | Time: 1 day**

- [ ] **1.2.1**: Configure Supabase client in frontend
  ```typescript
  // src/lib/supabase.ts
  import { createClient } from '@supabase/supabase-js'
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  export const supabase = createClient(supabaseUrl, supabaseAnonKey)
  ```
  **Files**: `src/lib/supabase.ts`, `.env`

- [ ] **1.2.2**: Create API service layer
  ```typescript
  // src/lib/api.ts
  import { supabase } from './supabase'
  
  export const api = {
    auth: {
      signIn: (email: string, password: string) => supabase.auth.signInWithPassword({ email, password }),
      signUp: (email: string, password: string) => supabase.auth.signUp({ email, password }),
      signOut: () => supabase.auth.signOut()
    },
    posts: {
      getAll: () => supabase.from('posts').select('*'),
      create: (post: any) => supabase.from('posts').insert(post)
    }
  }
  ```
  **Files**: `src/lib/api.ts`

### Task 1.3: Environment Configuration
**Priority: Critical | Time: 0.5 days**

- [ ] **1.3.1**: Set up environment variables
  ```env
  # Backend .env
  SUPABASE_URL=your_supabase_url
  SUPABASE_ANON_KEY=your_supabase_anon_key
  PORT=3000
  
  # Frontend .env
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  VITE_API_BASE_URL=http://localhost:3000
  ```
  **Files**: `backend/.env`, `frontend/.env`

### Task 1.4: CORS and Middleware Setup
**Priority: Critical | Time: 0.5 days**

- [ ] **1.4.1**: Configure CORS for frontend-backend communication
  ```javascript
  // src/middleware/cors.js
  import cors from 'cors';
  
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };
  
  export default cors(corsOptions);
  ```
  **Files**: `src/middleware/cors.js`

## Phase 2: Authentication Integration (2-3 days)

### Task 2.1: Backend Authentication Routes
**Priority: Critical | Time: 1 day**

- [ ] **2.1.1**: Create authentication endpoints
  ```javascript
  // src/routes/auth.js
  import express from 'express';
  import { supabase } from '../lib/supabase.js';
  
  const router = express.Router();
  
  router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    res.json({ success: !error, data, error });
  });
  
  router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });
    res.json({ success: !error, data, error });
  });
  
  export default router;
  ```
  **Files**: `src/routes/auth.js`

### Task 2.2: Frontend Authentication Context
**Priority: Critical | Time: 1.5 days**

- [ ] **2.2.1**: Create Auth Context Provider
  ```typescript
  // src/context/AuthContext.tsx
  import React, { createContext, useContext, useEffect, useState } from 'react';
  import { supabase } from '../lib/supabase';
  import type { User, Session } from '@supabase/supabase-js';
  
  interface AuthContextType {
    user: User | null;
    session: Session | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    loading: boolean;
  }
  
  const AuthContext = createContext<AuthContextType | undefined>(undefined);
  
  export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
  
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
  
      return () => subscription.unsubscribe();
    }, []);
  
    const signIn = async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    };
  
    const signUp = async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    };
  
    const signOut = async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    };
  
    return (
      <AuthContext.Provider value={{ user, session, signIn, signUp, signOut, loading }}>
        {children}
      </AuthContext.Provider>
    );
  };
  
  export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
  };
  ```
  **Files**: `src/context/AuthContext.tsx`, `src/hooks/useAuth.ts`

### Task 2.3: Protected Routes Implementation
**Priority: High | Time: 0.5 days**

- [ ] **2.3.1**: Create Protected Route component
  ```typescript
  // src/components/ProtectedRoute.tsx
  import React from 'react';
  import { Navigate } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext';
  
  interface ProtectedRouteProps {
    children: React.ReactNode;
  }
  
  export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { user, loading } = useAuth();
  
    if (loading) {
      return <div>Loading...</div>;
    }
  
    if (!user) {
      return <Navigate to="/login" replace />;
    }
  
    return <>{children}</>;
  };
  ```
  **Files**: `src/components/ProtectedRoute.tsx`

## Phase 3: Data Layer Integration (2-3 days)

### Task 3.1: TanStack Query Setup
**Priority: High | Time: 1 day**

- [ ] **3.1.1**: Configure TanStack Query
  ```typescript
  // src/lib/queryClient.ts
  import { QueryClient } from '@tanstack/react-query';
  
  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
  ```
  **Files**: `src/lib/queryClient.ts`, `src/providers/QueryProvider.tsx`

- [ ] **3.1.2**: Create data fetching hooks
  ```typescript
  // src/hooks/usePosts.ts
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
  import { supabase } from '../lib/supabase';
  
  export const usePosts = () => {
    return useQuery({
      queryKey: ['posts'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('posts')
          .select('*, profiles(full_name, avatar_url)')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
      },
    });
  };
  
  export const useCreatePost = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
      mutationFn: async (post: any) => {
        const { data, error } = await supabase
          .from('posts')
          .insert(post)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      },
    });
  };
  ```
  **Files**: `src/hooks/usePosts.ts`, `src/hooks/useProfile.ts`

### Task 3.2: Backend Data Endpoints
**Priority: High | Time: 1 day**

- [ ] **3.2.1**: Create posts API endpoints
  ```javascript
  // src/routes/posts.js
  import express from 'express';
  import { supabase } from '../lib/supabase.js';
  
  const router = express.Router();
  
  router.get('/', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  router.post('/', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert(req.body)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  export default router;
  ```
  **Files**: `src/routes/posts.js`, `src/routes/profiles.js`

### Task 3.3: Error Handling Integration
**Priority: High | Time: 1 day**

- [ ] **3.3.1**: Create error handling middleware
  ```javascript
  // src/middleware/errorHandler.js
  export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    const error = {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    };
    
    res.status(err.status || 500).json({
      success: false,
      error
    });
  };
  ```
  **Files**: `src/middleware/errorHandler.js`

- [ ] **3.3.2**: Frontend error boundaries
  ```typescript
  // src/components/ErrorBoundary.tsx
  import React from 'react';
  
  interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
  }
  
  export class ErrorBoundary extends React.Component<
    React.PropsWithChildren<{}>,
    ErrorBoundaryState
  > {
    constructor(props: React.PropsWithChildren<{}>) {
      super(props);
      this.state = { hasError: false };
    }
  
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
      return { hasError: true, error };
    }
  
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
  
    render() {
      if (this.state.hasError) {
        return (
          <div className="error-boundary">
            <h2>Something went wrong.</h2>
            <button onClick={() => this.setState({ hasError: false })}>
              Try again
            </button>
          </div>
        );
      }
  
      return this.props.children;
    }
  }
  ```
  **Files**: `src/components/ErrorBoundary.tsx`

## Phase 4: Real-time Connection (1-2 days)

### Task 4.1: Supabase Realtime Integration
**Priority: Medium | Time: 1.5 days**

- [ ] **4.1.1**: Set up realtime subscriptions
  ```typescript
  // src/hooks/useRealtime.ts
  import { useEffect } from 'react';
  import { useQueryClient } from '@tanstack/react-query';
  import { supabase } from '../lib/supabase';
  
  export const useRealtimePosts = () => {
    const queryClient = useQueryClient();
  
    useEffect(() => {
      const channel = supabase
        .channel('posts-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'posts' },
          (payload) => {
            console.log('Change received!', payload);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    }, [queryClient]);
  };
  ```
  **Files**: `src/hooks/useRealtime.ts`

## Phase 5: Testing Connection (1 day)

### Task 5.1: Integration Testing
**Priority: High | Time: 1 day**

- [ ] **5.1.1**: Test API endpoints
  ```javascript
  // test/api-integration.test.js
  import request from 'supertest';
  import app from '../src/server.js';
  
  describe('API Integration', () => {
    test('GET /api/posts returns posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
  ```
  **Files**: `test/api-integration.test.js`

- [ ] **5.1.2**: Test frontend-backend connection
  ```typescript
  // src/test/integration.test.tsx
  import { render, screen, waitFor } from '@testing-library/react';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { AuthProvider } from '../context/AuthContext';
  import App from '../App';
  
  test('app loads and connects to backend', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/CampusConnect/i)).toBeInTheDocument();
    });
  });
  ```
  **Files**: `src/test/integration.test.tsx`

## Completion Checklist

### ✅ Backend Ready
- [ ] Express server running on port 3000
- [ ] API routes responding correctly
- [ ] CORS configured for frontend
- [ ] Supabase connection working
- [ ] Error handling implemented

### ✅ Frontend Ready
- [ ] Supabase client configured
- [ ] Auth context working
- [ ] TanStack Query setup
- [ ] API calls successful
- [ ] Protected routes functional

### ✅ Integration Working
- [ ] Frontend can authenticate users
- [ ] Frontend can fetch/create posts
- [ ] Real-time updates working
- [ ] Error handling end-to-end
- [ ] Both servers running simultaneously

## Quick Start Commands

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev

# Terminal 3 - Test connection
curl http://localhost:3000/api/posts
```

## Success Criteria
- ✅ User can sign up/login from frontend
- ✅ User can create posts from frontend
- ✅ Posts appear in real-time
- ✅ No CORS errors
- ✅ Proper error handling throughout
