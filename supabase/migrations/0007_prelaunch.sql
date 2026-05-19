-- Sprint 7 — pre-launch: invite codes, reports, blocks, admin flag

-- Admin flag on profiles
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Invite codes
CREATE TABLE invite_codes (
  code TEXT PRIMARY KEY,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  redeemed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  max_uses INT DEFAULT 1,
  uses INT DEFAULT 0,
  note TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invite_active ON invite_codes(is_active) WHERE is_active = true;

ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all codes" ON invite_codes FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins manage codes" ON invite_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Reports (against profiles, posts, comments, events, messages)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('profile', 'post', 'comment', 'event', 'message')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reports_status ON reports(status, created_at DESC);
CREATE INDEX idx_reports_entity ON reports(entity_type, entity_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create own reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users read own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Admins read all reports" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins update reports" ON reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Blocks (mutual hide)
CREATE TABLE blocks (
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks(blocked_id);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own blocks" ON blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users block as themselves" ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users unblock as themselves" ON blocks FOR DELETE USING (auth.uid() = blocker_id);

-- Atomic-ish redeem function (still race-prone for max_uses>1, fine for single-use codes)
CREATE OR REPLACE FUNCTION redeem_invite_code(p_code TEXT, p_user UUID)
RETURNS BOOLEAN AS $$
DECLARE
  ok BOOLEAN := false;
BEGIN
  UPDATE invite_codes
  SET uses = uses + 1,
      redeemed_by = COALESCE(redeemed_by, p_user),
      redeemed_at = COALESCE(redeemed_at, now()),
      is_active = (uses + 1 < max_uses)
  WHERE code = p_code AND is_active = true AND uses < max_uses;
  GET DIAGNOSTICS ok = ROW_COUNT;
  RETURN ok;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed a handful of starter codes (founders can hand these out)
INSERT INTO invite_codes (code, note, max_uses) VALUES
  ('ADDA-MOHALI-01', 'Founder hand-out', 1),
  ('ADDA-MOHALI-02', 'Founder hand-out', 1),
  ('ADDA-MOHALI-03', 'Founder hand-out', 1),
  ('ADDA-FRIENDS-25', 'First 25 friends', 25)
ON CONFLICT (code) DO NOTHING;
