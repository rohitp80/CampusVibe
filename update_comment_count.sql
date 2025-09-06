-- Create function to increment post comment count
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION increment_post_comments(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments = comments + 1 
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Also create function to sync comment counts
CREATE OR REPLACE FUNCTION sync_post_comment_counts()
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments = (
    SELECT COUNT(*) 
    FROM post_comments 
    WHERE post_comments.post_id = posts.id
  );
END;
$$ LANGUAGE plpgsql;

-- Run sync to fix existing counts
SELECT sync_post_comment_counts();
