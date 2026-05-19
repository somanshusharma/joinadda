-- Sprint 1 — core user data
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  current_city_id UUID REFERENCES cities(id),
  hometown_city_id UUID REFERENCES cities(id),
  profession TEXT,
  company TEXT,
  vibe_tags TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  is_onboarded BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_current_city ON profiles(current_city_id);
CREATE INDEX idx_profiles_hometown ON profiles(hometown_city_id);
CREATE INDEX idx_profiles_username ON profiles(username);

CREATE TABLE follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are public" ON cities FOR SELECT USING (true);
CREATE POLICY "Profiles are public" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Follows are public" ON follows FOR SELECT USING (true);
CREATE POLICY "Users follow as themselves" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users unfollow as themselves" ON follows FOR DELETE USING (auth.uid() = follower_id);
