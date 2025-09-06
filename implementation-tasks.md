# CampusConnect Backend Implementation Tasks

## Task 1: Supabase Project Setup & Basic Schema
**Priority:** Critical
**Estimated Time:** 30 minutes

### Subtasks:
1. Create Supabase project
2. Set up basic tables (profiles, communities, posts)
3. Configure environment variables
4. Test database connection

### Implementation:
```sql
-- Create basic schema
CREATE TYPE mood_type AS ENUM ('excited', 'focused', 'thoughtful', 'inspired', 'calm', 'stressed', 'happy', 'motivated');
CREATE TYPE post_type AS ENUM ('text', 'image', 'code', 'advice');

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

CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  category TEXT,
  color TEXT,
  trending BOOLEAN DEFAULT false,
  tags TEXT[]
);

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
```

### Testing:
```javascript
// test/task1-setup.test.js
import { supabase } from '../src/lib/supabase.js'

// Test 1: Database connection
console.log('Testing database connection...')
const { data, error } = await supabase.from('profiles').select('count')
if (error) {
  console.error('❌ Database connection failed:', error)
} else {
  console.log('✅ Database connection successful')
}

// Test 2: Insert test profile
console.log('Testing profile creation...')
const testUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  username: 'test_user',
  display_name: 'Test User',
  bio: 'Test bio'
}

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .insert([testUser])
  .select()

if (profileError) {
  console.error('❌ Profile creation failed:', profileError)
} else {
  console.log('✅ Profile creation successful:', profile)
}

// Test 3: Insert test community
console.log('Testing community creation...')
const testCommunity = {
  name: 'TestCommunity',
  description: 'Test community',
  category: 'Technology'
}

const { data: community, error: communityError } = await supabase
  .from('communities')
  .insert([testCommunity])
  .select()

if (communityError) {
  console.error('❌ Community creation failed:', communityError)
} else {
  console.log('✅ Community creation successful:', community)
}
```

**Exit Criteria:** All tests pass, basic tables created, environment configured

---

## Task 2: Authentication & User Management
**Priority:** Critical
**Estimated Time:** 45 minutes

### Subtasks:
1. Configure Supabase Auth
2. Create profile trigger for new users
3. Implement user CRUD operations
4. Test authentication flow

### Implementation:
```sql
-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
```

### Testing:
```javascript
// test/task2-auth.test.js
import { supabase } from '../src/lib/supabase.js'

// Test 1: User signup
console.log('Testing user signup...')
const { data: signupData, error: signupError } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'testpassword123',
  options: {
    data: {
      username: 'testuser123',
      display_name: 'Test User 123'
    }
  }
})

if (signupError) {
  console.error('❌ Signup failed:', signupError)
} else {
  console.log('✅ Signup successful:', signupData.user?.id)
}

// Test 2: User login
console.log('Testing user login...')
const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'testpassword123'
})

if (loginError) {
  console.error('❌ Login failed:', loginError)
} else {
  console.log('✅ Login successful:', loginData.user?.id)
}

// Test 3: Profile auto-creation
console.log('Testing profile auto-creation...')
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', loginData.user?.id)
  .single()

if (profileError) {
  console.error('❌ Profile fetch failed:', profileError)
} else {
  console.log('✅ Profile auto-created:', profile)
}

// Test 4: Profile update
console.log('Testing profile update...')
const { data: updatedProfile, error: updateError } = await supabase
  .from('profiles')
  .update({ bio: 'Updated bio' })
  .eq('id', loginData.user?.id)
  .select()

if (updateError) {
  console.error('❌ Profile update failed:', updateError)
} else {
  console.log('✅ Profile update successful:', updatedProfile)
}
```

**Exit Criteria:** Auth works, profiles auto-created, RLS policies active

---

## Task 3: Posts System with CRUD Operations
**Priority:** High
**Estimated Time:** 60 minutes

### Subtasks:
1. Create posts table with indexes
2. Implement RLS policies for posts
3. Create custom functions for likes
4. Test CRUD operations

### Implementation:
```sql
-- Posts RLS policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_select" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_community_id ON posts(community_id);

-- Like function
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes = likes + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Testing:
```javascript
// test/task3-posts.test.js
import { supabase } from '../src/lib/supabase.js'

// Setup: Login first
const { data: loginData } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'testpassword123'
})

// Test 1: Create post
console.log('Testing post creation...')
const testPost = {
  user_id: loginData.user.id,
  type: 'text',
  content: 'This is a test post',
  mood: 'excited'
}

const { data: post, error: postError } = await supabase
  .from('posts')
  .insert([testPost])
  .select()

if (postError) {
  console.error('❌ Post creation failed:', postError)
} else {
  console.log('✅ Post creation successful:', post[0].id)
}

// Test 2: Fetch posts with profile data
console.log('Testing post fetch with joins...')
const { data: posts, error: fetchError } = await supabase
  .from('posts')
  .select(`
    *,
    profiles:user_id(username, display_name, avatar_url)
  `)
  .order('created_at', { ascending: false })

if (fetchError) {
  console.error('❌ Post fetch failed:', fetchError)
} else {
  console.log('✅ Post fetch successful:', posts.length, 'posts')
}

// Test 3: Like post
console.log('Testing post like...')
const { error: likeError } = await supabase.rpc('increment_likes', {
  post_id: post[0].id
})

if (likeError) {
  console.error('❌ Post like failed:', likeError)
} else {
  console.log('✅ Post like successful')
}

// Test 4: Update post
console.log('Testing post update...')
const { data: updatedPost, error: updateError } = await supabase
  .from('posts')
  .update({ content: 'Updated test post' })
  .eq('id', post[0].id)
  .select()

if (updateError) {
  console.error('❌ Post update failed:', updateError)
} else {
  console.log('✅ Post update successful:', updatedPost[0].updated_at)
}

// Test 5: Delete post
console.log('Testing post deletion...')
const { error: deleteError } = await supabase
  .from('posts')
  .delete()
  .eq('id', post[0].id)

if (deleteError) {
  console.error('❌ Post deletion failed:', deleteError)
} else {
  console.log('✅ Post deletion successful')
}
```

**Exit Criteria:** Posts CRUD works, RLS enforced, likes function works

---

## Task 4: Real-time Chat System
**Priority:** High
**Estimated Time:** 90 minutes

### Subtasks:
1. Create chat tables with proper relationships
2. Implement chat RLS policies
3. Set up real-time subscriptions
4. Test messaging flow

### Implementation:
```sql
CREATE TYPE chat_type AS ENUM ('direct', 'group', 'study');

CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type chat_type NOT NULL,
  last_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chat_rooms(id),
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_messages_chat_id_created_at ON messages(chat_id, created_at DESC);
CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);

-- RLS policies
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_rooms_access" ON chat_rooms FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "messages_access" ON messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_id = messages.chat_id AND user_id = auth.uid()
  )
);

CREATE POLICY "participants_access" ON chat_participants FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chat_participants cp 
    WHERE cp.chat_id = chat_participants.chat_id AND cp.user_id = auth.uid()
  )
);
```

### Testing:
```javascript
// test/task4-chat.test.js
import { supabase } from '../src/lib/supabase.js'

// Setup: Create two test users
const user1 = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'testpassword123'
})

// Test 1: Create chat room
console.log('Testing chat room creation...')
const { data: chatRoom, error: chatError } = await supabase
  .from('chat_rooms')
  .insert([{
    name: 'Test Chat',
    type: 'group'
  }])
  .select()

if (chatError) {
  console.error('❌ Chat room creation failed:', chatError)
} else {
  console.log('✅ Chat room created:', chatRoom[0].id)
}

// Test 2: Add participants
console.log('Testing participant addition...')
const { error: participantError } = await supabase
  .from('chat_participants')
  .insert([{
    chat_id: chatRoom[0].id,
    user_id: user1.data.user.id
  }])

if (participantError) {
  console.error('❌ Participant addition failed:', participantError)
} else {
  console.log('✅ Participant added successfully')
}

// Test 3: Send message
console.log('Testing message sending...')
const { data: message, error: messageError } = await supabase
  .from('messages')
  .insert([{
    chat_id: chatRoom[0].id,
    user_id: user1.data.user.id,
    content: 'Hello, this is a test message!'
  }])
  .select()

if (messageError) {
  console.error('❌ Message sending failed:', messageError)
} else {
  console.log('✅ Message sent successfully:', message[0].id)
}

// Test 4: Fetch messages with user data
console.log('Testing message fetch...')
const { data: messages, error: fetchError } = await supabase
  .from('messages')
  .select(`
    *,
    profiles:user_id(username, display_name, avatar_url)
  `)
  .eq('chat_id', chatRoom[0].id)
  .order('created_at', { ascending: true })

if (fetchError) {
  console.error('❌ Message fetch failed:', fetchError)
} else {
  console.log('✅ Messages fetched:', messages.length, 'messages')
}

// Test 5: Real-time subscription
console.log('Testing real-time subscription...')
const subscription = supabase
  .channel(`chat:${chatRoom[0].id}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `chat_id=eq.${chatRoom[0].id}`
  }, (payload) => {
    console.log('✅ Real-time message received:', payload.new.content)
  })
  .subscribe()

// Send test message for real-time
setTimeout(async () => {
  await supabase
    .from('messages')
    .insert([{
      chat_id: chatRoom[0].id,
      user_id: user1.data.user.id,
      content: 'Real-time test message!'
    }])
  
  setTimeout(() => {
    subscription.unsubscribe()
    console.log('✅ Real-time test completed')
  }, 1000)
}, 1000)
```

**Exit Criteria:** Chat rooms work, messages send/receive, real-time active

---

## Task 5: File Storage & Image Upload
**Priority:** Medium
**Estimated Time:** 45 minutes

### Subtasks:
1. Create storage buckets
2. Configure storage policies
3. Test file upload/download
4. Integrate with posts

### Implementation:
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('avatars', 'avatars', true),
  ('post-images', 'post-images', true);

-- Storage policies
CREATE POLICY "avatar_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "avatar_view" ON storage.objects FOR SELECT USING (
  bucket_id = 'avatars'
);

CREATE POLICY "post_images_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'post-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "post_images_view" ON storage.objects FOR SELECT USING (
  bucket_id = 'post-images'
);
```

### Testing:
```javascript
// test/task5-storage.test.js
import { supabase } from '../src/lib/supabase.js'

// Test 1: Upload avatar
console.log('Testing avatar upload...')
const avatarFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' })
const userId = (await supabase.auth.getUser()).data.user?.id

const { data: avatarUpload, error: avatarError } = await supabase.storage
  .from('avatars')
  .upload(`${userId}/avatar.jpg`, avatarFile)

if (avatarError) {
  console.error('❌ Avatar upload failed:', avatarError)
} else {
  console.log('✅ Avatar upload successful:', avatarUpload.path)
}

// Test 2: Get public URL
console.log('Testing public URL generation...')
const { data: publicURL } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`)

console.log('✅ Public URL generated:', publicURL.publicUrl)

// Test 3: Upload post image
console.log('Testing post image upload...')
const postImageFile = new File(['test'], 'post.jpg', { type: 'image/jpeg' })
const fileName = `${Date.now()}-post.jpg`

const { data: postImageUpload, error: postImageError } = await supabase.storage
  .from('post-images')
  .upload(fileName, postImageFile)

if (postImageError) {
  console.error('❌ Post image upload failed:', postImageError)
} else {
  console.log('✅ Post image upload successful:', postImageUpload.path)
}

// Test 4: Create post with image
console.log('Testing post with image...')
const { data: postWithImage, error: postWithImageError } = await supabase
  .from('posts')
  .insert([{
    user_id: userId,
    type: 'image',
    content: 'Post with image',
    image_url: supabase.storage.from('post-images').getPublicUrl(fileName).data.publicUrl
  }])
  .select()

if (postWithImageError) {
  console.error('❌ Post with image failed:', postWithImageError)
} else {
  console.log('✅ Post with image successful:', postWithImage[0].id)
}
```

**Exit Criteria:** File upload works, public URLs generated, images in posts

---

## Running Tests

### Setup Test Environment
```bash
# Create test directory
mkdir test
cd test

# Install dependencies
npm init -y
npm install @supabase/supabase-js

# Create supabase config
echo "export const supabase = createClient('YOUR_URL', 'YOUR_ANON_KEY')" > ../src/lib/supabase.js
```

### Run Individual Task Tests
```bash
# Run each test individually
node test/task1-setup.test.js
node test/task2-auth.test.js
node test/task3-posts.test.js
node test/task4-chat.test.js
node test/task5-storage.test.js
```

### Success Criteria for Each Task:
- ✅ All console logs show success messages
- ✅ No error messages in console
- ✅ Data appears correctly in Supabase dashboard
- ✅ Real-time features work as expected

**Next Steps:** Only proceed to next task when current task passes all tests!
