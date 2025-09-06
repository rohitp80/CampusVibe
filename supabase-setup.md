# CampusConnect Supabase Setup

## Database Tables

### 1. Profiles (User Extension)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  university TEXT,
  year TEXT,
  location TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Communities
```sql
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  category TEXT,
  color TEXT,
  trending BOOLEAN DEFAULT false,
  tags TEXT[]
);
```

### 3. Posts
```sql
-- Create enums for consistency and performance
CREATE TYPE mood_type AS ENUM ('excited', 'focused', 'thoughtful', 'inspired', 'calm', 'stressed', 'happy', 'motivated');
CREATE TYPE post_type AS ENUM ('text', 'image', 'code', 'advice');
CREATE TYPE chat_type AS ENUM ('direct', 'group', 'study');

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  community_id UUID REFERENCES communities(id),
  type post_type NOT NULL,
  content TEXT NOT NULL,
  code_snippet TEXT,
  image_url TEXT,
  mood mood_type,
  is_anonymous BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_community_id ON posts(community_id);
CREATE INDEX idx_posts_type ON posts(type);

-- Updated_at trigger
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4. Events
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  category TEXT,
  organizer_id UUID REFERENCES profiles(id),
  location TEXT,
  event_date TIMESTAMP,
  attendees INTEGER DEFAULT 0,
  max_attendees INTEGER,
  tags TEXT[]
);
```

### 5. Chat Rooms & Participants
```sql
-- Main chat rooms table
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type chat_type NOT NULL,
  last_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Separate participants table for better relational integrity
CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

-- Performance indexes
CREATE INDEX idx_chat_rooms_type ON chat_rooms(type);
CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);

-- Updated_at trigger
CREATE TRIGGER update_chat_rooms_updated_at BEFORE UPDATE ON chat_rooms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. Messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chat_rooms(id),
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Critical indexes for chat performance
CREATE INDEX idx_messages_chat_id_created_at ON messages(chat_id, created_at DESC);
CREATE INDEX idx_messages_user_id ON messages(user_id);
```

## Frontend Setup

### Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### Create Supabase Client
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Environment Variables (.env)
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## API Functions

### Posts API with Error Handling
```javascript
// src/api/posts.js
import { supabase } from '../lib/supabase'

### Posts API with Pagination & Filtering
```javascript
// src/api/posts.js
import { supabase } from '../lib/supabase'

export const getPosts = async ({ 
  page = 1, 
  limit = 20, 
  communityId = null, 
  userId = null, 
  type = null,
  retries = 3 
} = {}) => {
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(username, display_name, avatar_url),
        communities:community_id(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    
    // Apply filters
    if (communityId) query = query.eq('community_id', communityId)
    if (userId) query = query.eq('user_id', userId)
    if (type) query = query.eq('type', type)
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    return { 
      data, 
      error: null,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
        hasNext: page * limit < count,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    console.error('Error fetching posts:', error)
    
    // Retry logic for network errors
    if (retries > 0 && error.message?.includes('network')) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return getPosts({ page, limit, communityId, userId, type, retries: retries - 1 })
    }
    
    return { data: null, error: error.message, pagination: null }
  }
}

export const createPost = async (post) => {
  try {
    // Validate required fields
    if (!post.content?.trim()) {
      throw new Error('Post content is required')
    }
    
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        ...post,
        user_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error creating post:', error)
    return { data: null, error: error.message }
  }
}

export const likePost = async (postId) => {
  try {
    if (!postId) throw new Error('Post ID is required')
    
    const { data, error } = await supabase.rpc('increment_likes', {
      post_id: postId
    })
    
    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Error liking post:', error)
    return { data: null, error: error.message }
  }
}
```

### Authentication Hook
```javascript
// src/hooks/useAuth.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData }
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return { user, loading, signUp, signIn, signOut }
}
```

### Real-time Updates
```javascript
// src/hooks/useRealtimePosts.js
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimePosts() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    const subscription = supabase
      .channel('posts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => setPosts(prev => [payload.new, ...prev])
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => setPosts(prev => 
          prev.map(post => post.id === payload.new.id ? payload.new : post)
        )
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  return posts
}
```

## Row Level Security Policies (Data Protection)

### Posts Security
```sql
-- Enable RLS to protect user data
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read posts (public feed)
CREATE POLICY "Posts are viewable by everyone" 
ON posts FOR SELECT 
USING (true);

-- Only authenticated users can create posts as themselves
CREATE POLICY "Users can create posts" 
ON posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update/delete their own posts
CREATE POLICY "Users can update own posts" 
ON posts FOR UPDATE 
USING (auth.uid() = user_id);
```

### Chat Security
```sql
-- Enable RLS for chat privacy
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can only see chats they're participants in
CREATE POLICY "Users can view their chats" 
ON chat_rooms FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_id = id AND user_id = auth.uid()
  )
);

-- Users can only send messages to chats they've joined
CREATE POLICY "Users can send messages" 
ON messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_id = messages.chat_id AND user_id = auth.uid()
  )
);

-- Protect participant privacy
CREATE POLICY "Users can view chat participants" 
ON chat_participants FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.chat_id = chat_participants.chat_id AND cp.user_id = auth.uid()
  )
);
```

## Storage Buckets

### Create Storage Buckets
```sql
-- For user avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- For post images
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

-- For chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', false);
```

### Storage Policies
```sql
-- Avatar upload policy
CREATE POLICY "Users can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Post images policy
CREATE POLICY "Users can upload post images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');
```

## Performance Optimizations

### Database Indexes
```sql
-- Essential indexes for performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_university ON profiles(university);

CREATE INDEX idx_communities_category ON communities(category);
CREATE INDEX idx_communities_trending ON communities(trending);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_organizer ON events(organizer_id);

-- Composite indexes for complex queries
CREATE INDEX idx_posts_community_created ON posts(community_id, created_at DESC);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
```

### Activity Logging (Optional)
```sql
-- Activity log for analytics and debugging
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'post_created', 'post_liked', 'message_sent', etc.
  resource_type TEXT, -- 'post', 'message', 'event', etc.
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for activity queries
CREATE INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
```
- ✅ No backend code needed
- ✅ Real-time subscriptions built-in
- ✅ Authentication with social providers
- ✅ File storage with CDN
- ✅ Auto-generated REST APIs
- ✅ Row Level Security for data protection
- ✅ Database management UI
- ✅ Automatic scaling

## Development Best Practices
- Use TypeScript for better type safety
- Implement proper error boundaries
- Add input validation on frontend
- Test API calls in development
- Monitor performance with console logs
- Use enum types for consistent data
- Implement retry logic for network errors
- Document RLS policies for security clarity
