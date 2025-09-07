-- Add can_post column to community_members table
ALTER TABLE community_members 
ADD COLUMN can_post BOOLEAN DEFAULT FALSE;

-- Set can_post to TRUE for all admins
UPDATE community_members 
SET can_post = TRUE 
WHERE role = 'admin';

-- Optionally set can_post to TRUE for existing members (remove this if you want them restricted by default)
-- UPDATE community_members SET can_post = TRUE WHERE role = 'member';
