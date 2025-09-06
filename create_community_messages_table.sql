-- Create community_messages table
CREATE TABLE IF NOT EXISTS public.community_messages (
    id BIGSERIAL PRIMARY KEY,
    community_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_community_messages_community_id 
ON public.community_messages(community_id);

-- Enable Row Level Security (optional)
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on community_messages" 
ON public.community_messages 
FOR ALL 
USING (true) 
WITH CHECK (true);
