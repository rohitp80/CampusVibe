# CampusConnect Frontend-Backend Integration Requirements

## Project Analysis Summary

**Backend Stack:**
- Node.js with Supabase integration
- Environment: ES Modules
- Database: Supabase (PostgreSQL)
- Authentication: Supabase Auth + OAuth

**Frontend Stack:**
- React 18 + TypeScript + Vite
- UI: Radix UI + Tailwind CSS + shadcn/ui
- State Management: TanStack Query
- Routing: React Router DOM
- Forms: React Hook Form + Zod validation

## 1. API Integration Layer

### 1.1 HTTP Client Setup
```typescript
// src/lib/api.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 1.2 Environment Variables Required
```env
# Frontend .env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:3000
```

## 2. Authentication Integration

### 2.1 Auth Context Provider
```typescript
// src/context/AuthContext.tsx
interface AuthContextType {
  user: User | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}
```

### 2.2 Protected Routes Implementation
```typescript
// src/components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
}
```

### 2.3 OAuth Integration
- Google OAuth setup
- Session management
- Token refresh handling
- Logout functionality

## 3. Data Layer Integration

### 3.1 TanStack Query Setup
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})
```

### 3.2 Custom Hooks for Data Fetching
```typescript
// src/hooks/useAuth.ts
// src/hooks/usePosts.ts
// src/hooks/useProfile.ts
// src/hooks/useComments.ts
```

## 4. API Endpoints Mapping

### 4.1 Authentication Endpoints
- `POST /auth/signup` → Supabase Auth
- `POST /auth/signin` → Supabase Auth
- `POST /auth/signout` → Supabase Auth
- `GET /auth/session` → Supabase Auth
- `POST /auth/google` → OAuth Integration

### 4.2 User Profile Endpoints
- `GET /api/profile` → profiles table
- `PUT /api/profile` → profiles table
- `POST /api/profile/avatar` → Storage bucket

### 4.3 Posts & Content Endpoints
- `GET /api/posts` → posts table with pagination
- `POST /api/posts` → posts table
- `PUT /api/posts/:id` → posts table
- `DELETE /api/posts/:id` → posts table
- `GET /api/posts/:id/comments` → comments table

### 4.4 Real-time Features
- `WebSocket /ws/posts` → Real-time post updates
- `WebSocket /ws/comments` → Real-time comment updates

## 5. State Management Strategy

### 5.1 Global State Structure
```typescript
interface AppState {
  auth: AuthState
  posts: PostsState
  ui: UIState
  notifications: NotificationState
}
```

### 5.2 Cache Management
- Query invalidation strategies
- Optimistic updates
- Background refetching
- Error boundary handling

## 6. Error Handling & Validation

### 6.1 API Error Handling
```typescript
// src/lib/errorHandler.ts
interface APIError {
  message: string
  code: string
  details?: any
}
```

### 6.2 Form Validation Schema
```typescript
// src/lib/validationSchemas.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
```

## 7. Performance Optimization

### 7.1 Code Splitting
- Route-based splitting
- Component lazy loading
- Dynamic imports for heavy components

### 7.2 Caching Strategy
- React Query cache configuration
- Service worker for offline support
- Image optimization and lazy loading

### 7.3 Bundle Optimization
- Tree shaking configuration
- Chunk splitting strategy
- Asset optimization

## 8. Security Implementation

### 8.1 Authentication Security
- JWT token handling
- Secure cookie configuration
- CSRF protection
- XSS prevention

### 8.2 API Security
- Request/response sanitization
- Rate limiting on frontend
- Input validation
- Secure headers

## 9. Development Workflow

### 9.1 Environment Setup
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### 9.2 Testing Strategy
- Unit tests for hooks and utilities
- Integration tests for API calls
- E2E tests for critical user flows
- Mock service worker for API mocking

### 9.3 Build & Deployment
```bash
# Frontend build
npm run build

# Environment-specific builds
npm run build:dev
npm run build:prod
```

## 10. Implementation Priority

### Phase 1: Core Integration (Week 1)
1. ✅ Supabase client setup
2. ✅ Authentication context
3. ✅ Protected routes
4. ✅ Basic API hooks

### Phase 2: Data Layer (Week 2)
1. ✅ TanStack Query integration
2. ✅ CRUD operations for posts
3. ✅ User profile management
4. ✅ Error handling

### Phase 3: Advanced Features (Week 3)
1. 🔄 Real-time updates
2. 🔄 File upload integration
3. 🔄 Notification system
4. 🔄 Search functionality

### Phase 4: Optimization (Week 4)
1. ⏳ Performance optimization
2. ⏳ Security hardening
3. ⏳ Testing implementation
4. ⏳ Production deployment

## 11. Technical Debt & Considerations

### 11.1 Current Issues
- Backend lacks proper Express.js server structure
- No API versioning strategy
- Missing comprehensive error handling
- No request/response logging

### 11.2 Recommendations
1. **Backend Restructure**: Implement Express.js with proper middleware
2. **API Gateway**: Consider implementing API gateway pattern
3. **Monitoring**: Add application monitoring and logging
4. **Documentation**: Implement OpenAPI/Swagger documentation

## 12. File Structure Requirements

```
frontend/src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── forms/        # Form components
│   ├── layout/       # Layout components
│   └── features/     # Feature-specific components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and configurations
├── pages/            # Route components
├── context/          # React contexts
├── types/            # TypeScript type definitions
└── utils/            # Helper functions

backend/src/
├── api/              # API route handlers
├── lib/              # Database and external service clients
├── middleware/       # Express middleware
├── utils/            # Helper functions
└── types/            # TypeScript type definitions
```

## 13. Next Steps

1. **Immediate Actions**:
   - Set up proper Express.js server in backend
   - Implement authentication context in frontend
   - Create API service layer with proper error handling

2. **Short-term Goals**:
   - Complete CRUD operations for all entities
   - Implement real-time features
   - Add comprehensive testing

3. **Long-term Goals**:
   - Performance optimization
   - Security audit
   - Production deployment pipeline
