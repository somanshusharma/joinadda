-- v3.2 — Hangout approval flow (safety-first joins)
--
-- When a hangout has requires_approval = true (default), joining sets
-- status = 'pending'. Host gets notified and can accept (-> 'going')
-- or decline (-> 'declined'). joiner_count only counts 'going'.

ALTER TABLE hangouts
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true;

-- Expand the joiner status set.
ALTER TABLE hangout_joiners DROP CONSTRAINT IF EXISTS hangout_joiners_status_check;
ALTER TABLE hangout_joiners
  ADD CONSTRAINT hangout_joiners_status_check
  CHECK (status IN ('pending', 'going', 'cancelled', 'declined'));

-- Allow new notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN (
    'follow', 'post_reaction', 'comment', 'comment_reply',
    'event_rsvp', 'event_reminder', 'mention', 'dm',
    'hangout_join', 'hangout_request', 'hangout_accepted',
    'hangout_declined', 'hangout_starting', 'daily_match',
    'new_review'
  ));

-- Recompute joiner_count to only count 'going'
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

-- Only add to the hangout chat when accepted (status = going)
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

-- New notification logic: 'pending' -> notify host (hangout_request)
-- 'going' after pending -> notify joiner (hangout_accepted)
-- 'declined' -> notify joiner (hangout_declined)
CREATE OR REPLACE FUNCTION notify_hangout_join()
RETURNS TRIGGER AS $$
DECLARE
  host_uid UUID;
  joiner_name TEXT;
  hangout_title TEXT;
BEGIN
  SELECT host_id, activity INTO host_uid, hangout_title
    FROM hangouts WHERE id = NEW.hangout_id;
  SELECT display_name INTO joiner_name FROM profiles WHERE id = NEW.profile_id;

  -- Pending => host gets request
  IF NEW.status = 'pending' AND host_uid IS NOT NULL AND host_uid <> NEW.profile_id THEN
    INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id, message)
    VALUES (host_uid, NEW.profile_id, 'hangout_request', 'hangout', NEW.hangout_id,
            COALESCE(joiner_name, 'Someone') || ' wants to join your hangout');
  END IF;

  -- Going => either direct join (notify host) or accept (notify joiner)
  IF NEW.status = 'going' AND host_uid IS NOT NULL AND host_uid <> NEW.profile_id THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status <> 'going') THEN
      -- If transitioning from pending to going, it's an acceptance: notify joiner
      IF TG_OP = 'UPDATE' AND OLD.status = 'pending' THEN
        INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id, message)
        VALUES (NEW.profile_id, host_uid, 'hangout_accepted', 'hangout', NEW.hangout_id,
                'You''re in! ' || COALESCE(hangout_title, 'Hangout') || ' is on');
      ELSE
        -- Fresh direct join: notify host
        INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id, message)
        VALUES (host_uid, NEW.profile_id, 'hangout_join', 'hangout', NEW.hangout_id,
                COALESCE(joiner_name, 'Someone') || ' joined your hangout');
      END IF;
    END IF;
  END IF;

  -- Declined => notify joiner
  IF NEW.status = 'declined' AND TG_OP = 'UPDATE' AND OLD.status <> 'declined' THEN
    IF host_uid <> NEW.profile_id THEN
      INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id, message)
      VALUES (NEW.profile_id, host_uid, 'hangout_declined', 'hangout', NEW.hangout_id,
              'Your request for ' || COALESCE(hangout_title, 'a hangout') || ' wasn''t accepted');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_hangout_join_notify ON hangout_joiners;
CREATE TRIGGER on_hangout_join_notify
  AFTER INSERT OR UPDATE ON hangout_joiners
  FOR EACH ROW EXECUTE FUNCTION notify_hangout_join();

-- Update RLS: hosts can update joiner rows on their hangouts (to accept/decline)
DROP POLICY IF EXISTS "Host updates joiner status" ON hangout_joiners;
CREATE POLICY "Host updates joiner status" ON hangout_joiners
  FOR UPDATE USING (
    auth.uid() = profile_id
    OR EXISTS (
      SELECT 1 FROM hangouts
      WHERE id = hangout_joiners.hangout_id AND host_id = auth.uid()
    )
  );
