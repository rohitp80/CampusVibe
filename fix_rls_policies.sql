-- Fix RLS policies for post creation
-- Copy and paste this into your Supabase SQL Editor

-- Temporarily disable RLS for testing
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;

-- Or create proper policies (recommended)
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- 
-- DROP POLICY IF EXISTS "Users can create posts" ON posts;
-- DROP POLICY IF EXISTS "Users can view posts" ON posts;
-- 
-- CREATE POLICY "Users can view posts" ON posts
--   FOR SELECT USING (true);
-- 
-- CREATE POLICY "Users can create posts" ON posts
--   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- 
-- CREATE POLICY "Users can update own posts" ON posts
--   FOR UPDATE USING (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can delete own posts" ON posts
--   FOR DELETE USING (auth.uid() = user_id);
