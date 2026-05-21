-- v3.3 — Universal reviews.
--
-- One row = one review. Subject is polymorphic:
--   profile  -> review a person you met
--   spot     -> review a venue (host_listings.id)
--   trip     -> review a trip (events.id, kind='trip')
--   hangout  -> review a past hangout
--
-- Aggregates (avg_rating, review_count) are cached on each subject for fast display.

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  subject_type TEXT NOT NULL CHECK (
    subject_type IN ('profile', 'spot', 'trip', 'hangout')
  ),
  subject_id UUID NOT NULL,

  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,

  -- Optional: which event/hangout the reviewer was tagged in when they met the subject.
  context_type TEXT CHECK (context_type IN ('hangout', 'trip')),
  context_id UUID,

  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One review per (reviewer, subject) — they can edit, not stack.
  UNIQUE (reviewer_id, subject_type, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_subject ON reviews(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- ---------- aggregate columns on each subject ----------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

ALTER TABLE host_listings
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

ALTER TABLE hangouts
  ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;

-- ---------- recompute aggregates on review change ----------
CREATE OR REPLACE FUNCTION refresh_review_aggregates()
RETURNS TRIGGER AS $$
DECLARE
  sub_type TEXT;
  sub_id UUID;
  new_avg NUMERIC(3,2);
  new_count INT;
BEGIN
  sub_type := COALESCE(NEW.subject_type, OLD.subject_type);
  sub_id := COALESCE(NEW.subject_id, OLD.subject_id);

  SELECT
    ROUND(AVG(rating)::numeric, 2),
    COUNT(*)
    INTO new_avg, new_count
  FROM reviews
  WHERE subject_type = sub_type AND subject_id = sub_id;

  IF sub_type = 'profile' THEN
    UPDATE profiles SET avg_rating = new_avg, review_count = new_count WHERE id = sub_id;
  ELSIF sub_type = 'spot' THEN
    UPDATE host_listings SET avg_rating = new_avg, review_count = new_count WHERE id = sub_id;
  ELSIF sub_type = 'trip' THEN
    UPDATE events SET avg_rating = new_avg, review_count = new_count WHERE id = sub_id;
  ELSIF sub_type = 'hangout' THEN
    UPDATE hangouts SET avg_rating = new_avg, review_count = new_count WHERE id = sub_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_review_aggregates();

-- ---------- Notify subject (if a profile) on new review ----------
CREATE OR REPLACE FUNCTION notify_on_new_review()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subject_type = 'profile' AND NEW.reviewer_id <> NEW.subject_id THEN
    INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id, message)
    VALUES (NEW.subject_id, NEW.reviewer_id, 'new_review', 'profile', NEW.id,
            'You got a new review');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_review_notify ON reviews;
CREATE TRIGGER on_new_review_notify
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION notify_on_new_review();

-- ---------- RLS ----------
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can read public reviews; reviewer always sees their own
CREATE POLICY "Public reviews readable" ON reviews
  FOR SELECT USING (is_public = true OR auth.uid() = reviewer_id);

-- Insert as yourself, can't review yourself
CREATE POLICY "Users create own reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id
    AND NOT (subject_type = 'profile' AND subject_id = auth.uid())
  );

-- Edit / delete only your own
CREATE POLICY "Users edit own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);
CREATE POLICY "Users delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = reviewer_id);
