-- v2 — Daily Match (one suggested friend per day)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_matches') THEN
    CREATE TABLE daily_matches (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      matched_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      match_date DATE NOT NULL DEFAULT CURRENT_DATE,
      match_reason TEXT,
      match_score NUMERIC(3,2),
      action TEXT DEFAULT 'pending' CHECK (action IN ('pending', 'skipped', 'said_hi')),
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (user_id, match_date)
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'match_history') THEN
    CREATE TABLE match_history (
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      matched_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      last_matched_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (user_id, matched_user_id)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_matches_user_date ON daily_matches(user_id, match_date DESC);

ALTER TABLE daily_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own matches" ON daily_matches;
DROP POLICY IF EXISTS "Users create own matches" ON daily_matches;
DROP POLICY IF EXISTS "Users update own matches" ON daily_matches;
DROP POLICY IF EXISTS "Users read own history" ON match_history;
DROP POLICY IF EXISTS "Users record own history" ON match_history;

CREATE POLICY "Users read own matches" ON daily_matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own matches" ON daily_matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own matches" ON daily_matches FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users read own history" ON match_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users record own history" ON match_history FOR INSERT WITH CHECK (auth.uid() = user_id);

