-- Sprint 2/3 — posts, comments, reactions, polls
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'poll', 'question')),
  poll_options JSONB,
  reaction_counts JSONB DEFAULT '{}',
  comment_count INT DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_community ON posts(community_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('relatable', 'funny', 'fire', 'mood', 'heart')),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK ((post_id IS NOT NULL)::int + (comment_id IS NOT NULL)::int = 1),
  UNIQUE (post_id, profile_id, type),
  UNIQUE (comment_id, profile_id, type)
);

CREATE INDEX idx_reactions_post ON reactions(post_id);
CREATE INDEX idx_reactions_profile ON reactions(profile_id);

CREATE TABLE poll_votes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, profile_id)
);

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_count AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are public" ON posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users create own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "Comments are public" ON comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Users create own comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users update own comments" ON comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Reactions are public" ON reactions FOR SELECT USING (true);
CREATE POLICY "Users react as themselves" ON reactions FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users unreact as themselves" ON reactions FOR DELETE USING (auth.uid() = profile_id);

CREATE POLICY "Poll votes public" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "Users vote as themselves" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users change own vote" ON poll_votes FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users remove own vote" ON poll_votes FOR DELETE USING (auth.uid() = profile_id);
