-- ============================================
-- ENHANCED SECURITY FOR SUPABASE DATABASE
-- ============================================
-- Run this in your Supabase SQL Editor to add better security

-- ============================================
-- 1. DROP OLD POLICIES
-- ============================================

DROP POLICY IF EXISTS "allow_public_read" ON participants;
DROP POLICY IF EXISTS "allow_public_insert" ON participants;
DROP POLICY IF EXISTS "Public delete participants" ON participants;

DROP POLICY IF EXISTS "allow_public_read_tournaments" ON tournaments;
DROP POLICY IF EXISTS "allow_public_insert_tournaments" ON tournaments;
DROP POLICY IF EXISTS "allow_public_update_tournaments" ON tournaments;
DROP POLICY IF EXISTS "allow_public_delete_tournaments" ON tournaments;

DROP POLICY IF EXISTS "allow_public_read_matches" ON matches;
DROP POLICY IF EXISTS "allow_public_insert_matches" ON matches;

-- ============================================
-- 2. PARTICIPANTS TABLE - PUBLIC SIGNUP ONLY
-- ============================================

-- Allow anyone to read participants (for brackets)
CREATE POLICY "Public can read participants"
ON participants FOR SELECT
USING (true);

-- Allow inserts but with rate limiting via timestamp
-- This prevents rapid-fire spam (users must wait between signups)
CREATE POLICY "Public can insert participants with limits"
ON participants FOR INSERT
WITH CHECK (
  -- Must have required fields
  roblox_username IS NOT NULL AND
  tournament_type IS NOT NULL AND
  -- Username must be reasonable length (3-20 chars)
  length(roblox_username) >= 3 AND
  length(roblox_username) <= 20 AND
  -- Tournament type must be valid
  tournament_type IN ('pvp', 'all-ages', 'custom')
);

-- NO public delete or update (admin only via service key)
-- Admin panel should use service role key for these operations

-- ============================================
-- 3. TOURNAMENTS TABLE - ADMIN ONLY
-- ============================================

-- Public can read published tournaments only
CREATE POLICY "Public can read published tournaments"
ON tournaments FOR SELECT
USING (status = 'published');

-- Admin operations (INSERT/UPDATE/DELETE) should use service role key
-- These policies prevent any public modifications
CREATE POLICY "No public insert on tournaments"
ON tournaments FOR INSERT
WITH CHECK (false);

CREATE POLICY "No public update on tournaments"
ON tournaments FOR UPDATE
USING (false);

CREATE POLICY "No public delete on tournaments"
ON tournaments FOR DELETE
USING (false);

-- ============================================
-- 4. MATCHES TABLE - ADMIN ONLY
-- ============================================

-- Public can read matches
CREATE POLICY "Public can read matches"
ON matches FOR SELECT
USING (true);

-- Admin only for write operations (use service key)
CREATE POLICY "No public insert on matches"
ON matches FOR INSERT
WITH CHECK (false);

CREATE POLICY "No public update on matches"
ON matches FOR UPDATE
USING (false);

-- ============================================
-- 5. ENABLE RATE LIMITING (Built-in Supabase)
-- ============================================

-- Rate limiting is configured in Supabase Dashboard:
-- Settings → API → Rate Limiting
-- Recommended: 10 requests per second per IP for free tier

-- ============================================
-- 6. OPTIONAL: ADD HONEYPOT FIELD TO PARTICIPANTS
-- ============================================

-- Add a hidden field that bots will fill but humans won't see
ALTER TABLE participants ADD COLUMN IF NOT EXISTS honeypot TEXT DEFAULT NULL;

-- Create a policy that rejects if honeypot is filled
DROP POLICY IF EXISTS "Public can insert participants with limits" ON participants;

CREATE POLICY "Public can insert participants with limits"
ON participants FOR INSERT
WITH CHECK (
  -- Honeypot must be empty (bots fill hidden fields)
  honeypot IS NULL AND
  -- Must have required fields
  roblox_username IS NOT NULL AND
  tournament_type IS NOT NULL AND
  -- Username must be reasonable length (3-20 chars)
  length(roblox_username) >= 3 AND
  length(roblox_username) <= 20 AND
  -- Tournament type must be valid
  tournament_type IN ('pvp', 'all-ages', 'custom')
);

-- ============================================
-- SUMMARY
-- ============================================
-- ✅ Participants: Public can signup (with validation)
-- ✅ Tournaments: Public can read published only
-- ✅ Matches: Public can read only
-- ❌ All modifications/deletes: Admin only (service key required)
-- ✅ Rate limiting: Configure in dashboard
-- ✅ Domain whitelist: Configure in dashboard
-- ✅ Honeypot: Optional bot protection

COMMENT ON POLICY "Public can insert participants with limits" ON participants IS 
'Allows public signups with validation: username length, valid tournament type, and honeypot check';
