-- Fix column type mismatch for foreign key relationship
-- Change community_members.user_id from text to uuid

-- First, alter the column type
ALTER TABLE community_members 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Also fix community_id if needed
ALTER TABLE community_members 
ALTER COLUMN community_id TYPE uuid USING community_id::uuid;

-- Now add the foreign key constraints
ALTER TABLE community_members 
ADD CONSTRAINT fk_community_members_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE community_members 
ADD CONSTRAINT fk_community_members_community_id 
FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
