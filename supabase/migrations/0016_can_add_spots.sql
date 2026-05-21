-- v3.1 — Per-user permission: who can add spot listings.
-- Defaults to false. Admin flips it manually (via Supabase Studio
-- or the /admin/hosts panel) for vetted hosts.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS can_add_spots BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_can_add_spots
  ON profiles(can_add_spots) WHERE can_add_spots = true;

-- Tighten host_listings INSERT: must either be admin or have the flag.
DROP POLICY IF EXISTS "Hosts manage own listings" ON host_listings;

CREATE POLICY "Permitted hosts insert listings" ON host_listings
  FOR INSERT WITH CHECK (
    auth.uid() = host_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND (can_add_spots = true OR is_admin = true)
    )
  );

CREATE POLICY "Hosts update own listings" ON host_listings
  FOR UPDATE USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts delete own listings" ON host_listings
  FOR DELETE USING (auth.uid() = host_id);
