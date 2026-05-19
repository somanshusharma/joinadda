-- Waitlist for pre-launch email collection
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  city TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_waitlist_created ON waitlist(created_at DESC);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authed) can sign up to the waitlist
CREATE POLICY "Public can join waitlist" ON waitlist FOR INSERT WITH CHECK (true);

-- Only admins can read it
CREATE POLICY "Admins read waitlist" ON waitlist FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
