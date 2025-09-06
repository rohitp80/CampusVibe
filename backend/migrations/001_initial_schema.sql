-- Create enums for consistency
CREATE TYPE mood_type AS ENUM ('excited', 'focused', 'thoughtful', 'inspired', 'calm', 'stressed', 'happy', 'motivated');
CREATE TYPE post_type AS ENUM ('text', 'image', 'code', 'advice');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  university TEXT,
  year TEXT,
  location TEXT,
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Communities table
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  category TEXT,
  color TEXT,
  trending BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  community_id UUID REFERENCES communities(id),
  type post_type NOT NULL,
  content TEXT NOT NULL,
  code_snippet TEXT,
  image_url TEXT,
  mood mood_type,
  is_anonymous BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample communities
INSERT INTO communities (name, description, category, color, trending) VALUES
  ('CodeCoffee', 'Developers sharing code snippets and programming tips', 'Technology', '#8B5CF6', true),
  ('StudyBuddies', 'Find study partners and share study materials', 'Academic', '#3B82F6', true),
  ('ArtistsCorner', 'Creative minds sharing artwork and inspiration', 'Creative', '#10B981', false),
  ('WellnessWarriors', 'Mental health support and wellness tips', 'Wellness', '#F59E0B', true),
  ('CampusEvents', 'Local campus events and meetups', 'Events', '#EF4444', false);
