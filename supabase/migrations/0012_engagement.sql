-- v2.1 engagement hooks: presence, streaks, post-event tagging

-- 1) Presence + streaks on profiles
ALTER TABLE profiles ADD COLUMN last_seen_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN streak_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN streak_updated_on DATE;

CREATE INDEX idx_profiles_last_seen ON profiles(last_seen_at DESC);

-- 2) "Met at" — lightweight social capital after IRL events / hangouts.
--    Reporter says "I met X at hangout Y". Two-way mutual flag exposed via UI later.
CREATE TABLE met_at (
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  met_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  context_type TEXT NOT NULL CHECK (context_type IN ('hangout', 'event')),
  context_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (reporter_id, met_id, context_type, context_id),
  CHECK (reporter_id <> met_id)
);

CREATE INDEX idx_met_at_met ON met_at(met_id);
CREATE INDEX idx_met_at_reporter ON met_at(reporter_id);

ALTER TABLE met_at ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read met_at involving me" ON met_at FOR SELECT USING (
  auth.uid() = reporter_id OR auth.uid() = met_id
);
CREATE POLICY "Tag people I met" ON met_at FOR INSERT WITH CHECK (
  auth.uid() = reporter_id
);
CREATE POLICY "Untag people I tagged" ON met_at FOR DELETE USING (
  auth.uid() = reporter_id
);

-- 3) Lightweight server-side touch function for heartbeats.
--    Bumps last_seen_at + handles streaks atomically, in one DB round-trip.
--    Returns the resulting streak_count.
CREATE OR REPLACE FUNCTION touch_presence(p_user UUID)
RETURNS INT AS $$
DECLARE
  prev_day DATE;
  current_streak INT;
BEGIN
  SELECT streak_updated_on, streak_count
    INTO prev_day, current_streak
  FROM profiles WHERE id = p_user;

  IF prev_day IS NULL THEN
    UPDATE profiles
       SET last_seen_at = now(),
           streak_count = 1,
           streak_updated_on = CURRENT_DATE
     WHERE id = p_user;
    RETURN 1;
  END IF;

  IF prev_day = CURRENT_DATE THEN
    -- Already counted today; just bump presence.
    UPDATE profiles SET last_seen_at = now() WHERE id = p_user;
    RETURN COALESCE(current_streak, 1);
  END IF;

  IF prev_day = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day — extend streak.
    UPDATE profiles
       SET last_seen_at = now(),
           streak_count = COALESCE(current_streak, 0) + 1,
           streak_updated_on = CURRENT_DATE
     WHERE id = p_user;
    RETURN COALESCE(current_streak, 0) + 1;
  END IF;

  -- Gap > 1 day, reset to 1.
  UPDATE profiles
     SET last_seen_at = now(),
         streak_count = 1,
         streak_updated_on = CURRENT_DATE
   WHERE id = p_user;
  RETURN 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
