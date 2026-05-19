-- Sprint 1 — communities
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  icon TEXT,
  type TEXT NOT NULL CHECK (type IN ('city', 'hometown_in_city', 'interest', 'company')),
  city_id UUID REFERENCES cities(id),
  hometown_id UUID REFERENCES cities(id),
  member_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_communities_type ON communities(type);
CREATE INDEX idx_communities_city ON communities(city_id);

CREATE TABLE community_members (
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (community_id, profile_id)
);

CREATE INDEX idx_community_members_profile ON community_members(profile_id);

CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = member_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_community_member_count AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Communities are public" ON communities FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone authed can create a community" ON communities
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Membership is public" ON community_members FOR SELECT USING (true);
CREATE POLICY "Users join as themselves" ON community_members
  FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users leave as themselves" ON community_members
  FOR DELETE USING (auth.uid() = profile_id);
