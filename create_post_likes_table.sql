-- Create post_likes table to match your post_comments structure
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  post_id UUID NULL,
  user_id UUID NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NULL DEFAULT NOW(),
  CONSTRAINT post_likes_pkey PRIMARY KEY (id),
  CONSTRAINT post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
  CONSTRAINT post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id),
  CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON public.post_likes USING btree (post_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.post_likes USING btree (user_id) TABLESPACE pg_default;
