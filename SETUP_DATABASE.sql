-- ============================================
-- COMPLETE DATABASE SETUP FOR BRACKET SYSTEM
-- ============================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor and click RUN

-- ============================================
-- STEP 1: ADD BRACKET_STYLE TO TOURNAMENTS
-- ============================================

ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS bracket_style VARCHAR(20) DEFAULT 'scoreboard';

ALTER TABLE tournaments
DROP CONSTRAINT IF EXISTS tournaments_bracket_style_check;

ALTER TABLE tournaments
ADD CONSTRAINT tournaments_bracket_style_check 
CHECK (bracket_style IN ('scoreboard', 'head-to-head', 'mixed'));

UPDATE tournaments 
SET bracket_style = 'scoreboard' 
WHERE bracket_style IS NULL;

-- ============================================
-- STEP 2: CREATE BRACKET_MATCHES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS bracket_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  player1_seed INTEGER,
  player2_seed INTEGER,
  next_match_id UUID REFERENCES bracket_matches(id),
  match_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  CONSTRAINT valid_round CHECK (round_number > 0),
  CONSTRAINT valid_match_number CHECK (match_number > 0),
  CONSTRAINT winner_must_be_player CHECK (
    winner_id IS NULL OR 
    winner_id = player1_id OR 
    winner_id = player2_id
  )
);

CREATE INDEX IF NOT EXISTS idx_bracket_matches_tournament 
ON bracket_matches(tournament_id);

CREATE INDEX IF NOT EXISTS idx_bracket_matches_round 
ON bracket_matches(tournament_id, round_number);

-- ============================================
-- STEP 3: ENABLE RLS ON BRACKET_MATCHES
-- ============================================

ALTER TABLE bracket_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read bracket matches" ON bracket_matches;
DROP POLICY IF EXISTS "Public can insert bracket matches" ON bracket_matches;
DROP POLICY IF EXISTS "Public can update bracket matches" ON bracket_matches;
DROP POLICY IF EXISTS "Public can delete bracket matches" ON bracket_matches;

CREATE POLICY "Public can read bracket matches"
ON bracket_matches FOR SELECT
USING (true);

CREATE POLICY "Public can insert bracket matches"
ON bracket_matches FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update bracket matches"
ON bracket_matches FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can delete bracket matches"
ON bracket_matches FOR DELETE
USING (true);

-- ============================================
-- STEP 4: FIX RLS POLICIES FOR ALL TABLES
-- ============================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "No public insert on tournaments" ON tournaments;
DROP POLICY IF EXISTS "No public update on tournaments" ON tournaments;
DROP POLICY IF EXISTS "No public delete on tournaments" ON tournaments;
DROP POLICY IF EXISTS "Allow all operations on tournaments" ON tournaments;

DROP POLICY IF EXISTS "Public can insert participants with limits" ON participants;
DROP POLICY IF EXISTS "Allow all reads on participants" ON participants;
DROP POLICY IF EXISTS "Allow all updates on participants" ON participants;
DROP POLICY IF EXISTS "Allow all deletes on participants" ON participants;
DROP POLICY IF EXISTS "Allow participant inserts with validation" ON participants;

DROP POLICY IF EXISTS "Public can read matches" ON matches;
DROP POLICY IF EXISTS "No public insert on matches" ON matches;
DROP POLICY IF EXISTS "No public update on matches" ON matches;
DROP POLICY IF EXISTS "allow_public_read_matches" ON matches;
DROP POLICY IF EXISTS "allow_public_insert_matches" ON matches;
DROP POLICY IF EXISTS "Allow all operations on matches" ON matches;

-- TOURNAMENTS: Allow all operations (admin panel has password)
CREATE POLICY "Allow all operations on tournaments"
ON tournaments FOR ALL
USING (true)
WITH CHECK (true);

-- PARTICIPANTS: Allow signup with validation + admin operations
CREATE POLICY "Allow participant inserts with validation"
ON participants FOR INSERT
WITH CHECK (
  honeypot IS NULL AND
  roblox_username IS NOT NULL AND
  tournament_type IS NOT NULL AND
  length(roblox_username) >= 3 AND
  length(roblox_username) <= 20 AND
  tournament_type IN ('pvp', 'all-ages', 'custom')
);

CREATE POLICY "Allow all reads on participants"
ON participants FOR SELECT
USING (true);

CREATE POLICY "Allow all updates on participants"
ON participants FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all deletes on participants"
ON participants FOR DELETE
USING (true);

-- MATCHES: Allow all operations
CREATE POLICY "Allow all operations on matches"
ON matches FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================
-- SUMMARY
-- ============================================
-- ✅ Added bracket_style field to tournaments
-- ✅ Created bracket_matches table
-- ✅ Set up RLS policies for all tables
-- ✅ Ready for bracket generation!

SELECT 'Database setup complete! ✓' as status;
