-- Drop RLS policies that depend on user_id column
DROP POLICY IF EXISTS "Users can leave communities they joined" ON community_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON community_members;
DROP POLICY IF EXISTS "Admins can manage members" ON community_members;

-- Alter column types
ALTER TABLE community_members 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

ALTER TABLE community_members 
ALTER COLUMN community_id TYPE uuid USING community_id::uuid;

-- Add foreign key constraints
ALTER TABLE community_members 
ADD CONSTRAINT fk_community_members_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE community_members 
ADD CONSTRAINT fk_community_members_community_id 
FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;

-- Recreate RLS policies with correct types
CREATE POLICY "Users can view their own memberships" ON community_members
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can leave communities they joined" ON community_members
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage members" ON community_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM community_members cm 
    WHERE cm.community_id = community_members.community_id 
    AND cm.user_id = auth.uid() 
    AND cm.role = 'admin'
  )
);
