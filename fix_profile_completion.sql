-- Fix the calculate_profile_completion function
CREATE OR REPLACE FUNCTION calculate_profile_completion(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completion_score INTEGER := 0;
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = profile_id;
  
  -- Basic info (40 points)
  IF profile_record.display_name IS NOT NULL AND profile_record.display_name != 'New User' THEN
    completion_score := completion_score + 10;
  END IF;
  
  IF profile_record.bio IS NOT NULL AND LENGTH(profile_record.bio) > 10 THEN
    completion_score := completion_score + 10;
  END IF;
  
  IF profile_record.avatar_url IS NOT NULL THEN
    completion_score := completion_score + 10;
  END IF;
  
  IF profile_record.university IS NOT NULL THEN
    completion_score := completion_score + 10;
  END IF;
  
  -- Academic info (30 points)
  IF profile_record.course IS NOT NULL THEN
    completion_score := completion_score + 10;
  END IF;
  
  IF profile_record.department IS NOT NULL THEN
    completion_score := completion_score + 10;
  END IF;
  
  IF profile_record.graduation_year IS NOT NULL THEN
    completion_score := completion_score + 10;
  END IF;
  
  -- Personal info (20 points)
  IF profile_record.interests IS NOT NULL AND array_length(profile_record.interests, 1) > 0 THEN
    completion_score := completion_score + 10;
  END IF;
  
  IF profile_record.skills IS NOT NULL AND array_length(profile_record.skills, 1) > 0 THEN
    completion_score := completion_score + 10;
  END IF;
  
  -- Contact info (10 points)
  IF profile_record.location IS NOT NULL THEN
    completion_score := completion_score + 5;
  END IF;
  
  -- Fix: Check if social_links has any keys
  IF profile_record.social_links IS NOT NULL AND jsonb_typeof(profile_record.social_links) = 'object' AND profile_record.social_links != '{}'::jsonb THEN
    completion_score := completion_score + 5;
  END IF;
  
  RETURN completion_score;
END;
$$ LANGUAGE plpgsql;
