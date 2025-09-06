-- Enable RLS on posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for posts
CREATE POLICY "posts_select" ON posts 
  FOR SELECT USING (true);

CREATE POLICY "posts_insert" ON posts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update" ON posts 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "posts_delete" ON posts 
  FOR DELETE USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_community_id ON posts(community_id);
CREATE INDEX idx_posts_type ON posts(type);

-- Like function
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes = likes + 1 WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement likes function
CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts SET likes = GREATEST(likes - 1, 0) WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to posts
CREATE TRIGGER update_posts_updated_at 
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments table
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS for comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON post_comments 
  FOR SELECT USING (true);

CREATE POLICY "comments_insert" ON post_comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_update" ON post_comments 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "comments_delete" ON post_comments 
  FOR DELETE USING (auth.uid() = user_id);

-- Comment indexes
CREATE INDEX idx_comments_post_id ON post_comments(post_id, created_at);
CREATE INDEX idx_comments_user_id ON post_comments(user_id);
