-- Check if RLS is enabled on posts table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'posts';

-- Check existing RLS policies on posts table
SELECT * FROM pg_policies WHERE tablename = 'posts';

-- If RLS is blocking real-time, you need to either:
-- Option 1: Disable RLS temporarily (NOT recommended for production)
-- ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Option 2: Create proper RLS policies for real-time (RECOMMENDED)
-- Allow users to see posts in communities they're members of
CREATE POLICY "Users can view posts in their communities" ON posts
FOR SELECT USING (
  community_id IN (
    SELECT community_id FROM community_members 
    WHERE user_id = auth.uid()
  )
);

-- Allow users to insert posts in communities they're members of
CREATE POLICY "Users can insert posts in their communities" ON posts
FOR INSERT WITH CHECK (
  community_id IN (
    SELECT community_id FROM community_members 
    WHERE user_id = auth.uid()
  )
);

-- Enable real-time for posts table
ALTER PUBLICATION supabase_realtime ADD TABLE posts;
