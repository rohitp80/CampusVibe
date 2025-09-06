-- Fix for CampusVibe profile fields compatibility
-- Run this in your Supabase SQL Editor

-- 1. Add full_name column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Sync existing data
UPDATE profiles 
SET full_name = display_name 
WHERE full_name IS NULL AND display_name IS NOT NULL;

-- 3. Create a view for backward compatibility (optional)
CREATE OR REPLACE VIEW posts_with_profiles AS
SELECT 
  p.*,
  pr.username,
  pr.display_name,
  pr.full_name,
  pr.avatar_url,
  pr.bio,
  pr.university
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id;

-- 4. Create a trigger to keep both fields in sync
CREATE OR REPLACE FUNCTION sync_profile_names()
RETURNS TRIGGER AS $$
BEGIN
  -- If full_name is updated, sync to display_name
  IF NEW.full_name IS DISTINCT FROM OLD.full_name AND NEW.full_name IS NOT NULL THEN
    NEW.display_name := NEW.full_name;
  END IF;
  
  -- If display_name is updated, sync to full_name
  IF NEW.display_name IS DISTINCT FROM OLD.display_name AND NEW.display_name IS NOT NULL THEN
    NEW.full_name := NEW.display_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Apply the trigger
DROP TRIGGER IF EXISTS sync_profile_names_trigger ON profiles;
CREATE TRIGGER sync_profile_names_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_names();

-- 6. Update the user creation function to handle both fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  display_name_value TEXT;
BEGIN
  display_name_value := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name', 
    NEW.raw_user_meta_data->>'name',
    'New User'
  );

  INSERT INTO public.profiles (
    id, 
    username, 
    display_name,
    full_name,
    avatar_url,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username', 
      NEW.raw_user_meta_data->>'preferred_username',
      LOWER(REPLACE(NEW.raw_user_meta_data->>'name', ' ', '_')),
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    display_name_value,
    display_name_value,
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Ensure the trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
