-- v2 — Hangouts: lightweight informal invitations
CREATE TABLE hangouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  city_id UUID REFERENCES cities(id) NOT NULL,

  -- What
  activity TEXT NOT NULL,
  description TEXT,

  -- When
  time_window TEXT NOT NULL,
  starts_at TIMESTAMPTZ,
  flexibility TEXT DEFAULT 'flexible' CHECK (flexibility IN ('fixed', 'flexible', 'open')),

  -- Where
  location TEXT NOT NULL,
  is_location_flexible BOOLEAN DEFAULT false,

  -- Group
  max_joiners INT DEFAULT 4,
  joiner_count INT DEFAULT 0,

  -- Visibility
  visibility TEXT DEFAULT 'city' CHECK (visibility IN ('city', 'community', 'connections')),
  community_id UUID REFERENCES communities(id),

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'happening', 'completed', 'cancelled')),

  -- Chat link (filled in by trigger)
  conversation_id UUID REFERENCES conversations(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

CREATE INDEX idx_hangouts_city ON hangouts(city_id);
CREATE INDEX idx_hangouts_status ON hangouts(status);
CREATE INDEX idx_hangouts_expires ON hangouts(expires_at);
CREATE INDEX idx_hangouts_host ON hangouts(host_id);

CREATE TABLE hangout_joiners (
  hangout_id UUID REFERENCES hangouts(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'cancelled')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (hangout_id, profile_id)
);

CREATE INDEX idx_hangout_joiners_profile ON hangout_joiners(profile_id);

-- Allow hangout_group conversations
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check
  CHECK (type IN ('dm', 'event_group', 'hangout_group'));

-- Auto-create chat on hangout creation
CREATE OR REPLACE FUNCTION create_hangout_chat()
RETURNS TRIGGER AS $$
DECLARE
  conv_id UUID;
BEGIN
  INSERT INTO conversations (type, name)
  VALUES ('hangout_group', NEW.activity)
  RETURNING id INTO conv_id;

  INSERT INTO conversation_participants (conversation_id, profile_id)
  VALUES (conv_id, NEW.host_id)
  ON CONFLICT DO NOTHING;

  UPDATE hangouts SET conversation_id = conv_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_hangout_created AFTER INSERT ON hangouts
  FOR EACH ROW EXECUTE FUNCTION create_hangout_chat();

-- Add joiner to chat when they're "going"
CREATE OR REPLACE FUNCTION add_to_hangout_chat()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'going' THEN
    INSERT INTO conversation_participants (conversation_id, profile_id)
    SELECT conversation_id, NEW.profile_id
    FROM hangouts
    WHERE id = NEW.hangout_id AND conversation_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_hangout_joiner AFTER INSERT OR UPDATE ON hangout_joiners
  FOR EACH ROW EXECUTE FUNCTION add_to_hangout_chat();

-- Keep joiner_count fresh
CREATE OR REPLACE FUNCTION update_hangout_joiner_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE hangouts SET joiner_count = (
    SELECT COUNT(*) FROM hangout_joiners
    WHERE hangout_id = COALESCE(NEW.hangout_id, OLD.hangout_id)
      AND status = 'going'
  ) WHERE id = COALESCE(NEW.hangout_id, OLD.hangout_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_hangout_joiner_count AFTER INSERT OR UPDATE OR DELETE ON hangout_joiners
  FOR EACH ROW EXECUTE FUNCTION update_hangout_joiner_count();

-- Notify host when someone joins
CREATE OR REPLACE FUNCTION notify_hangout_join()
RETURNS TRIGGER AS $$
DECLARE
  host_uid UUID;
  joiner_name TEXT;
BEGIN
  IF NEW.status = 'going' THEN
    SELECT host_id INTO host_uid FROM hangouts WHERE id = NEW.hangout_id;
    SELECT display_name INTO joiner_name FROM profiles WHERE id = NEW.profile_id;

    IF host_uid IS NOT NULL AND host_uid <> NEW.profile_id THEN
      INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id, message)
      VALUES (host_uid, NEW.profile_id, 'hangout_join', 'hangout', NEW.hangout_id,
              joiner_name || ' joined your hangout');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Open up notifications.type to new values
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'follow', 'post_reaction', 'comment', 'comment_reply',
    'event_rsvp', 'event_reminder', 'mention', 'dm',
    'hangout_join', 'hangout_starting', 'daily_match'
  ));

CREATE TRIGGER on_hangout_join_notify AFTER INSERT ON hangout_joiners
  FOR EACH ROW EXECUTE FUNCTION notify_hangout_join();

-- RLS
ALTER TABLE hangouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hangout_joiners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hangouts visible city-wide" ON hangouts FOR SELECT USING (
  visibility = 'city' OR host_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM hangout_joiners
    WHERE hangout_id = hangouts.id AND profile_id = auth.uid()
  )
);
CREATE POLICY "Users create own hangouts" ON hangouts FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Users update own hangouts" ON hangouts FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Users delete own hangouts" ON hangouts FOR DELETE USING (auth.uid() = host_id);

CREATE POLICY "Joiners visible" ON hangout_joiners FOR SELECT USING (true);
CREATE POLICY "Users join as themselves" ON hangout_joiners FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users update own join" ON hangout_joiners FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users leave as themselves" ON hangout_joiners FOR DELETE USING (auth.uid() = profile_id);
