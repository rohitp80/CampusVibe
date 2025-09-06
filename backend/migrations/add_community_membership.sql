-- Community Membership System Migration
-- This extends existing schema without breaking current functionality

-- Create community_members table
CREATE TABLE IF NOT EXISTS public.community_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate memberships
    UNIQUE(community_id, user_id)
);

-- Add creator_id to communities table (for auto-admin assignment)
ALTER TABLE public.communities 
ADD COLUMN IF NOT EXISTS creator_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_members_community_id 
ON public.community_members(community_id);

CREATE INDEX IF NOT EXISTS idx_community_members_user_id 
ON public.community_members(user_id);

-- Enable Row Level Security
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view community members" 
ON public.community_members FOR SELECT 
USING (true);

CREATE POLICY "Users can join communities" 
ON public.community_members FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can leave communities they joined" 
ON public.community_members FOR DELETE 
USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Function to check if user is admin of community
CREATE OR REPLACE FUNCTION is_community_admin(community_id_param TEXT, user_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_id = community_id_param 
        AND user_id = user_id_param 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is member of community
CREATE OR REPLACE FUNCTION is_community_member(community_id_param TEXT, user_id_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM community_members 
        WHERE community_id = community_id_param 
        AND user_id = user_id_param
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
