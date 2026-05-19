-- Sprint 4 — events / trips / hangouts
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  city_id UUID REFERENCES cities(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT,
  type TEXT NOT NULL CHECK (type IN ('trip', 'workcation', 'hangout', 'community_event')),
  category TEXT,
  location TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  max_attendees INT,
  cost_per_person_inr INT DEFAULT 0,
  cost_notes TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'full', 'cancelled', 'completed')),
  attendee_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_events_city ON events(city_id);
CREATE INDEX idx_events_starts ON events(starts_at);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_community ON events(community_id);
CREATE INDEX idx_events_organizer ON events(organizer_id);

CREATE TABLE event_rsvps (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'going' CHECK (status IN ('going', 'maybe', 'waitlist', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (event_id, profile_id)
);

CREATE INDEX idx_rsvps_profile ON event_rsvps(profile_id);

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE events SET attendee_count = (
    SELECT COUNT(*) FROM event_rsvps
    WHERE event_id = COALESCE(NEW.event_id, OLD.event_id) AND status = 'going'
  ) WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rsvp_attendee_count AFTER INSERT OR UPDATE OR DELETE ON event_rsvps
  FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- Auto-add the organizer as a 'going' RSVP
CREATE OR REPLACE FUNCTION add_organizer_rsvp()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO event_rsvps (event_id, profile_id, status)
  VALUES (NEW.id, NEW.organizer_id, 'going')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_event_organizer_rsvp AFTER INSERT ON events
  FOR EACH ROW EXECUTE FUNCTION add_organizer_rsvp();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are public" ON events FOR SELECT USING (true);
CREATE POLICY "Users create own events" ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers update own events" ON events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers delete own events" ON events FOR DELETE USING (auth.uid() = organizer_id);

CREATE POLICY "RSVPs are public" ON event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users RSVP as themselves" ON event_rsvps FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users update own RSVP" ON event_rsvps FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Users cancel own RSVP" ON event_rsvps FOR DELETE USING (auth.uid() = profile_id);
