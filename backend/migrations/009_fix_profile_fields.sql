-- Fix profile fields compatibility
-- Add full_name as alias for display_name to maintain compatibility

-- Add full_name column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Create a trigger to sync full_name with display_name
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

-- Create trigger
DROP TRIGGER IF EXISTS sync_profile_names_trigger ON profiles;
CREATE TRIGGER sync_profile_names_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_names();

-- Sync existing data
UPDATE profiles SET full_name = display_name WHERE full_name IS NULL AND display_name IS NOT NULL;
UPDATE profiles SET display_name = full_name WHERE display_name IS NULL AND full_name IS NOT NULL;

-- Update the profile creation function to handle both fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  display_name_value TEXT;
BEGIN
  -- Determine display name from various sources
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
    display_name_value, -- Set both fields to the same value
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
