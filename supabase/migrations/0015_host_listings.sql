-- v3 — Host listings (marketplace supply side) + leads (founder-led intros)
--
-- Mental model:
--   host_listings = a venue/service owned by a verified host
--                   (cricket turf, yoga studio, board-game cafe, trek package…)
--   host_leads    = when a user creates a hangout linked to a listing,
--                   we capture the connection so the founder + the host
--                   can follow up with the requester.

-- ---------- profiles: mark verified hosts ----------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_verified_host BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS host_bio TEXT,
  ADD COLUMN IF NOT EXISTS host_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS host_contact_whatsapp TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_verified_host
  ON profiles(is_verified_host) WHERE is_verified_host = true;

-- ---------- host_listings ----------
CREATE TABLE IF NOT EXISTS host_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  city_id UUID REFERENCES cities(id) NOT NULL,

  title TEXT NOT NULL,
  description TEXT,
  activity_tag TEXT NOT NULL,           -- cricket, yoga, trek, board_games, …

  address TEXT,
  map_url TEXT,                         -- google maps share link

  -- Pricing (nullable = free / pay-at-venue)
  price_inr INT,
  price_unit TEXT CHECK (price_unit IN ('per_hour','per_person','per_session','flat')),

  -- Capacity guidance shown on the card
  capacity_min INT DEFAULT 2,
  capacity_max INT DEFAULT 20,

  -- Direct contact (founder-vetted)
  contact_phone TEXT,
  contact_whatsapp TEXT,
  contact_email TEXT,

  photo_url TEXT,

  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_host_listings_city ON host_listings(city_id);
CREATE INDEX idx_host_listings_activity ON host_listings(activity_tag);
CREATE INDEX idx_host_listings_active ON host_listings(is_active) WHERE is_active = true;

-- ---------- hangouts: optional link to a listing ----------
ALTER TABLE hangouts
  ADD COLUMN IF NOT EXISTS host_listing_id UUID REFERENCES host_listings(id),
  ADD COLUMN IF NOT EXISTS activity_tag TEXT;

CREATE INDEX IF NOT EXISTS idx_hangouts_activity_tag ON hangouts(activity_tag);
CREATE INDEX IF NOT EXISTS idx_hangouts_listing ON hangouts(host_listing_id);

-- ---------- host_leads ----------
-- One row per (hangout linked to a listing).
-- Founder sees them all in /admin/leads to follow up personally.
CREATE TABLE IF NOT EXISTS host_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES host_listings(id) ON DELETE CASCADE NOT NULL,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  hangout_id UUID REFERENCES hangouts(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Snapshot in case hangout is edited / deleted later
  expected_headcount INT,
  requested_for_time TEXT,
  note_to_host TEXT,

  status TEXT DEFAULT 'new' CHECK (
    status IN ('new', 'contacted', 'confirmed', 'cancelled', 'completed')
  ),
  founder_note TEXT,    -- internal note for follow-up

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_host_leads_listing ON host_leads(listing_id);
CREATE INDEX idx_host_leads_host ON host_leads(host_id);
CREATE INDEX idx_host_leads_status ON host_leads(status);
CREATE INDEX idx_host_leads_created ON host_leads(created_at DESC);

-- ---------- Trigger: create lead + notify host when a hangout is linked ----------
CREATE OR REPLACE FUNCTION create_host_lead_on_hangout()
RETURNS TRIGGER AS $$
DECLARE
  listing_host UUID;
  listing_title TEXT;
  requester_name TEXT;
BEGIN
  IF NEW.host_listing_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT host_id, title INTO listing_host, listing_title
    FROM host_listings WHERE id = NEW.host_listing_id;

  IF listing_host IS NULL THEN
    RETURN NEW;
  END IF;

  -- Capture the lead
  INSERT INTO host_leads (
    listing_id, host_id, hangout_id, requester_id,
    expected_headcount, requested_for_time
  )
  VALUES (
    NEW.host_listing_id, listing_host, NEW.id, NEW.host_id,
    NEW.max_joiners, NEW.time_window
  );

  -- Notify the host (only if they're a real platform user, not the same person)
  IF listing_host <> NEW.host_id THEN
    SELECT display_name INTO requester_name FROM profiles WHERE id = NEW.host_id;
    INSERT INTO notifications (
      recipient_id, actor_id, type, entity_type, entity_id, message
    )
    VALUES (
      listing_host, NEW.host_id, 'hangout_join', 'hangout', NEW.id,
      COALESCE(requester_name, 'Someone') || ' wants to use ' || listing_title
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_hangout_listing_lead ON hangouts;
CREATE TRIGGER on_hangout_listing_lead
  AFTER INSERT ON hangouts
  FOR EACH ROW EXECUTE FUNCTION create_host_lead_on_hangout();

-- ---------- RLS ----------
ALTER TABLE host_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_leads ENABLE ROW LEVEL SECURITY;

-- Listings are public (anyone browsing can see them)
CREATE POLICY "Listings public read" ON host_listings
  FOR SELECT USING (is_active = true);
CREATE POLICY "Hosts manage own listings" ON host_listings
  FOR ALL USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

-- Leads visible to the host (their leads) or the requester (their request).
-- Founder access is via service-role from /admin (bypasses RLS).
CREATE POLICY "Host or requester read leads" ON host_leads
  FOR SELECT USING (
    auth.uid() = host_id OR auth.uid() = requester_id
  );
CREATE POLICY "Host updates lead status" ON host_leads
  FOR UPDATE USING (auth.uid() = host_id);
