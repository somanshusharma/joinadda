-- v2.2 — Quick polls inside a hangout so the crew can coordinate
-- ("Are you actually coming?" / "What time?" / "Which venue?")

CREATE TABLE IF NOT EXISTS hangout_polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hangout_id UUID REFERENCES hangouts(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  -- JSON array of { index: number, label: string }
  options JSONB NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hangout_polls_hangout
  ON hangout_polls(hangout_id, created_at DESC);

CREATE TABLE IF NOT EXISTS hangout_poll_votes (
  poll_id UUID REFERENCES hangout_polls(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  option_index INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (poll_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_hangout_poll_votes_poll
  ON hangout_poll_votes(poll_id);

ALTER TABLE hangout_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE hangout_poll_votes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read polls (so the hangout page works for guests too if we expose it later).
DROP POLICY IF EXISTS "Polls are public" ON hangout_polls;
CREATE POLICY "Polls are public" ON hangout_polls FOR SELECT USING (true);

-- Only the host OR a "going" joiner can create a poll on a hangout.
DROP POLICY IF EXISTS "Members can create polls" ON hangout_polls;
CREATE POLICY "Members can create polls" ON hangout_polls FOR INSERT WITH CHECK (
  auth.uid() = created_by AND (
    EXISTS (
      SELECT 1 FROM hangouts h
      WHERE h.id = hangout_id AND h.host_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM hangout_joiners j
      WHERE j.hangout_id = hangout_polls.hangout_id
        AND j.profile_id = auth.uid()
        AND j.status = 'going'
    )
  )
);

-- Creator can update (e.g. pin) or delete their own poll.
DROP POLICY IF EXISTS "Creator updates poll" ON hangout_polls;
CREATE POLICY "Creator updates poll" ON hangout_polls FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Creator deletes poll" ON hangout_polls;
CREATE POLICY "Creator deletes poll" ON hangout_polls FOR DELETE USING (auth.uid() = created_by);

-- Votes — readable by anyone, writable by members of the hangout the poll belongs to.
DROP POLICY IF EXISTS "Votes are public" ON hangout_poll_votes;
CREATE POLICY "Votes are public" ON hangout_poll_votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Members vote" ON hangout_poll_votes;
CREATE POLICY "Members vote" ON hangout_poll_votes FOR INSERT WITH CHECK (
  auth.uid() = profile_id AND
  EXISTS (
    SELECT 1 FROM hangout_polls p
    JOIN hangouts h ON h.id = p.hangout_id
    WHERE p.id = hangout_poll_votes.poll_id
      AND (
        h.host_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM hangout_joiners j
          WHERE j.hangout_id = h.id
            AND j.profile_id = auth.uid()
            AND j.status = 'going'
        )
      )
  )
);

DROP POLICY IF EXISTS "Members change own vote" ON hangout_poll_votes;
CREATE POLICY "Members change own vote" ON hangout_poll_votes FOR UPDATE USING (
  auth.uid() = profile_id
);

DROP POLICY IF EXISTS "Members remove own vote" ON hangout_poll_votes;
CREATE POLICY "Members remove own vote" ON hangout_poll_votes FOR DELETE USING (
  auth.uid() = profile_id
);
