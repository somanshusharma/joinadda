-- Sprint 5 — DMs + event group chats
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('dm', 'event_group')),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conv_event ON conversations(event_id);
CREATE INDEX idx_conv_last_msg ON conversations(last_message_at DESC);

CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, profile_id)
);

CREATE INDEX idx_conv_participants_profile ON conversation_participants(profile_id);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conv ON messages(conversation_id, created_at DESC);

-- Bump conversation last_message_at when a new message arrives
CREATE OR REPLACE FUNCTION bump_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_bump AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION bump_conversation_last_message();

-- Auto-create event group chat when an event is created
CREATE OR REPLACE FUNCTION create_event_chat()
RETURNS TRIGGER AS $$
DECLARE
  conv_id UUID;
BEGIN
  INSERT INTO conversations (type, event_id, name)
  VALUES ('event_group', NEW.id, NEW.title)
  RETURNING id INTO conv_id;

  INSERT INTO conversation_participants (conversation_id, profile_id)
  VALUES (conv_id, NEW.organizer_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_event_created AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION create_event_chat();

-- Add user to event chat when they RSVP "going"
CREATE OR REPLACE FUNCTION add_to_event_chat()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'going' THEN
    INSERT INTO conversation_participants (conversation_id, profile_id)
    SELECT c.id, NEW.profile_id
    FROM conversations c
    WHERE c.event_id = NEW.event_id
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rsvp_join_chat AFTER INSERT OR UPDATE ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION add_to_event_chat();

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Participants see their own conversations
CREATE POLICY "Participants read conversations" ON conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conversations.id
    AND profile_id = auth.uid()
  )
);

-- Anyone authenticated can create a conversation (we'll wire participants right after)
CREATE POLICY "Users create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Participants read membership" ON conversation_participants FOR SELECT USING (
  profile_id = auth.uid() OR EXISTS (
    SELECT 1 FROM conversation_participants p2
    WHERE p2.conversation_id = conversation_participants.conversation_id
    AND p2.profile_id = auth.uid()
  )
);

CREATE POLICY "Users add themselves" ON conversation_participants FOR INSERT WITH CHECK (
  profile_id = auth.uid()
);

CREATE POLICY "Users update own membership" ON conversation_participants FOR UPDATE USING (
  profile_id = auth.uid()
);

CREATE POLICY "Users leave conversation" ON conversation_participants FOR DELETE USING (
  profile_id = auth.uid()
);

CREATE POLICY "Participants read messages" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND profile_id = auth.uid()
  )
);

CREATE POLICY "Participants send messages" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = messages.conversation_id
    AND profile_id = auth.uid()
  )
);
