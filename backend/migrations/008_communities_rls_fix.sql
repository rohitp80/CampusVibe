-- Fix communities RLS policies for public access
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Allow public read access to communities
CREATE POLICY "communities_public_read" ON communities 
  FOR SELECT USING (true);

-- Allow authenticated users to create communities
CREATE POLICY "communities_authenticated_create" ON communities 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow community creators to update their communities
CREATE POLICY "communities_creator_update" ON communities 
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow community creators to delete their communities  
CREATE POLICY "communities_creator_delete" ON communities 
  FOR DELETE USING (auth.role() = 'authenticated');
