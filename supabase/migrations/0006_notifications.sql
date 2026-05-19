-- Sprint 6 — notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'follow', 'post_reaction', 'comment', 'comment_reply',
    'event_rsvp', 'event_reminder', 'mention', 'dm'
  )),
  entity_type TEXT,
  entity_id UUID,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notif_recipient ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notif_unread ON notifications(recipient_id, is_read) WHERE is_read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (
  recipient_id = auth.uid()
);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (
  recipient_id = auth.uid()
);

-- Follow → notification
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id)
  VALUES (NEW.following_id, NEW.follower_id, 'follow', 'profile', NEW.follower_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_notify AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Reaction on post → notify post author
CREATE OR REPLACE FUNCTION notify_on_reaction()
RETURNS TRIGGER AS $$
DECLARE
  author UUID;
BEGIN
  IF NEW.post_id IS NULL THEN RETURN NEW; END IF;
  SELECT author_id INTO author FROM posts WHERE id = NEW.post_id;
  IF author IS NULL OR author = NEW.profile_id THEN RETURN NEW; END IF;
  INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id)
  VALUES (author, NEW.profile_id, 'post_reaction', 'post', NEW.post_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_reaction_notify AFTER INSERT ON reactions
  FOR EACH ROW EXECUTE FUNCTION notify_on_reaction();

-- Comment → notify post author + parent comment author
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_author UUID;
  parent_author UUID;
BEGIN
  SELECT author_id INTO post_author FROM posts WHERE id = NEW.post_id;

  IF NEW.parent_id IS NOT NULL THEN
    SELECT author_id INTO parent_author FROM comments WHERE id = NEW.parent_id;
    IF parent_author IS NOT NULL AND parent_author <> NEW.author_id THEN
      INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id)
      VALUES (parent_author, NEW.author_id, 'comment_reply', 'post', NEW.post_id);
    END IF;
  END IF;

  IF post_author IS NOT NULL
     AND post_author <> NEW.author_id
     AND post_author <> COALESCE(parent_author, '00000000-0000-0000-0000-000000000000'::uuid)
  THEN
    INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id)
    VALUES (post_author, NEW.author_id, 'comment', 'post', NEW.post_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_notify AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- RSVP going → notify organizer
CREATE OR REPLACE FUNCTION notify_on_rsvp()
RETURNS TRIGGER AS $$
DECLARE
  organizer UUID;
BEGIN
  IF NEW.status <> 'going' THEN RETURN NEW; END IF;
  SELECT organizer_id INTO organizer FROM events WHERE id = NEW.event_id;
  IF organizer IS NULL OR organizer = NEW.profile_id THEN RETURN NEW; END IF;
  INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id)
  VALUES (organizer, NEW.profile_id, 'event_rsvp', 'event', NEW.event_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_rsvp_notify AFTER INSERT ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION notify_on_rsvp();

-- DM (only first message in a conversation or after a long gap) → notify other participants
CREATE OR REPLACE FUNCTION notify_on_dm()
RETURNS TRIGGER AS $$
DECLARE
  conv_type TEXT;
BEGIN
  SELECT type INTO conv_type FROM conversations WHERE id = NEW.conversation_id;
  IF conv_type <> 'dm' THEN RETURN NEW; END IF;

  INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id)
  SELECT cp.profile_id, NEW.sender_id, 'dm', 'conversation', NEW.conversation_id
  FROM conversation_participants cp
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.profile_id <> NEW.sender_id
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.recipient_id = cp.profile_id
        AND n.type = 'dm'
        AND n.entity_id = NEW.conversation_id
        AND n.is_read = false
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_dm_notify AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_dm();
