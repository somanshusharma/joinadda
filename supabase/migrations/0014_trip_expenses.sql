-- v2.3 — Trip expenses (split-the-bill, Splitwise-style)
-- Each expense has one payer + N shares (who's-on-the-hook + how much each owes).
-- Settlements record "Arjun paid Riya back ₹400" so the running balance clears.

CREATE TABLE IF NOT EXISTS trip_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  paid_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  amount_inr INT NOT NULL CHECK (amount_inr > 0),
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_expenses_event
  ON trip_expenses(event_id, created_at DESC);

CREATE TABLE IF NOT EXISTS trip_expense_shares (
  expense_id UUID REFERENCES trip_expenses(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  share_inr INT NOT NULL CHECK (share_inr >= 0),
  PRIMARY KEY (expense_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_shares_profile
  ON trip_expense_shares(profile_id);

CREATE TABLE IF NOT EXISTS trip_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  from_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount_inr INT NOT NULL CHECK (amount_inr > 0),
  note TEXT,
  settled_at TIMESTAMPTZ DEFAULT now(),
  CHECK (from_id <> to_id)
);

CREATE INDEX IF NOT EXISTS idx_trip_settlements_event
  ON trip_settlements(event_id, settled_at DESC);

ALTER TABLE trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_settlements ENABLE ROW LEVEL SECURITY;

-- Attendees can SELECT (read) all expenses + shares + settlements for trips they're going to.
DROP POLICY IF EXISTS "Attendees read expenses" ON trip_expenses;
CREATE POLICY "Attendees read expenses" ON trip_expenses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM event_rsvps r
    WHERE r.event_id = trip_expenses.event_id
      AND r.profile_id = auth.uid()
      AND r.status = 'going'
  )
  OR EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = trip_expenses.event_id AND e.organizer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Attendees read shares" ON trip_expense_shares;
CREATE POLICY "Attendees read shares" ON trip_expense_shares FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM trip_expenses te
    JOIN event_rsvps r ON r.event_id = te.event_id
    WHERE te.id = trip_expense_shares.expense_id
      AND r.profile_id = auth.uid()
      AND r.status = 'going'
  )
  OR EXISTS (
    SELECT 1 FROM trip_expenses te
    JOIN events e ON e.id = te.event_id
    WHERE te.id = trip_expense_shares.expense_id
      AND e.organizer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Attendees read settlements" ON trip_settlements;
CREATE POLICY "Attendees read settlements" ON trip_settlements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM event_rsvps r
    WHERE r.event_id = trip_settlements.event_id
      AND r.profile_id = auth.uid()
      AND r.status = 'going'
  )
  OR EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = trip_settlements.event_id AND e.organizer_id = auth.uid()
  )
);

-- INSERTs — only attendees (going) of the trip can add records, recording themselves as creator.
DROP POLICY IF EXISTS "Attendees add expenses" ON trip_expenses;
CREATE POLICY "Attendees add expenses" ON trip_expenses FOR INSERT WITH CHECK (
  auth.uid() = created_by AND (
    EXISTS (
      SELECT 1 FROM event_rsvps r
      WHERE r.event_id = trip_expenses.event_id
        AND r.profile_id = auth.uid()
        AND r.status = 'going'
    )
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = trip_expenses.event_id AND e.organizer_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Creator writes shares" ON trip_expense_shares;
CREATE POLICY "Creator writes shares" ON trip_expense_shares FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM trip_expenses te
    WHERE te.id = trip_expense_shares.expense_id
      AND te.created_by = auth.uid()
  )
);

-- Creator can delete their own expense (cascades shares).
DROP POLICY IF EXISTS "Creator deletes expenses" ON trip_expenses;
CREATE POLICY "Creator deletes expenses" ON trip_expenses FOR DELETE USING (
  auth.uid() = created_by
);

-- Settlements: either the payer or the receiver can record them.
DROP POLICY IF EXISTS "Pair records settlement" ON trip_settlements;
CREATE POLICY "Pair records settlement" ON trip_settlements FOR INSERT WITH CHECK (
  (auth.uid() = from_id OR auth.uid() = to_id) AND
  (
    EXISTS (
      SELECT 1 FROM event_rsvps r
      WHERE r.event_id = trip_settlements.event_id
        AND r.profile_id = auth.uid()
        AND r.status = 'going'
    )
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = trip_settlements.event_id AND e.organizer_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Pair deletes settlement" ON trip_settlements;
CREATE POLICY "Pair deletes settlement" ON trip_settlements FOR DELETE USING (
  auth.uid() = from_id OR auth.uid() = to_id
);
