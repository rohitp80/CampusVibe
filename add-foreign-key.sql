-- Add foreign key relationship between community_members and profiles
-- This will allow Supabase to automatically handle joins

-- First, ensure the community_members table has the correct structure
ALTER TABLE community_members 
ADD CONSTRAINT fk_community_members_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Also add foreign key to communities table if not exists
ALTER TABLE community_members 
ADD CONSTRAINT fk_community_members_community_id 
FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- Refresh the schema cache (this helps Supabase recognize the relationships)
NOTIFY pgrst, 'reload schema';
