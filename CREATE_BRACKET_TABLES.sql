-- ============================================
-- CREATE BRACKET SYSTEM TABLES
-- ============================================
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE BRACKET_MATCHES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS bracket_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,  -- 1=Round of 16/8, 2=Quarters, 3=Semis, 4=Finals
  match_number INTEGER NOT NULL,  -- Position in round (1, 2, 3, etc.)
  player1_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  player2_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  player1_seed INTEGER,  -- Seeding from FFA rounds or initial seeding
  player2_seed INTEGER,
  next_match_id UUID REFERENCES bracket_matches(id),  -- Which match winner advances to
  match_status VARCHAR(20) DEFAULT 'pending',  -- pending, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Ensure valid data
  CONSTRAINT valid_round CHECK (round_number > 0),
  CONSTRAINT valid_match_number CHECK (match_number > 0),
  CONSTRAINT winner_must_be_player CHECK (
    winner_id IS NULL OR 
    winner_id = player1_id OR 
    winner_id = player2_id
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bracket_matches_tournament 
ON bracket_matches(tournament_id);

CREATE INDEX IF NOT EXISTS idx_bracket_matches_round 
ON bracket_matches(tournament_id, round_number);

-- ============================================
-- 2. ENABLE RLS ON BRACKET_MATCHES
-- ============================================

ALTER TABLE bracket_matches ENABLE ROW LEVEL SECURITY;

-- Public can read brackets
CREATE POLICY "Public can read bracket matches"
ON bracket_matches FOR SELECT
USING (true);

-- Public can insert/update (admin panel uses anon key)
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
-- 3. ADD HELPER FUNCTIONS
-- ============================================

-- Function to get bracket structure for a tournament
CREATE OR REPLACE FUNCTION get_tournament_bracket(p_tournament_id UUID)
RETURNS TABLE (
  match_id UUID,
  round_number INTEGER,
  match_number INTEGER,
  player1_username TEXT,
  player2_username TEXT,
  winner_username TEXT,
  player1_seed INTEGER,
  player2_seed INTEGER,
  match_status VARCHAR(20)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bm.id as match_id,
    bm.round_number,
    bm.match_number,
    p1.roblox_username as player1_username,
    p2.roblox_username as player2_username,
    w.roblox_username as winner_username,
    bm.player1_seed,
    bm.player2_seed,
    bm.match_status
  FROM bracket_matches bm
  LEFT JOIN participants p1 ON bm.player1_id = p1.id
  LEFT JOIN participants p2 ON bm.player2_id = p2.id
  LEFT JOIN participants w ON bm.winner_id = w.id
  WHERE bm.tournament_id = p_tournament_id
  ORDER BY bm.round_number, bm.match_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUMMARY
-- ============================================
-- ✅ Created bracket_matches table
-- ✅ Added RLS policies (public access for now)
-- ✅ Created indexes for performance
-- ✅ Added helper function to get bracket data

COMMENT ON TABLE bracket_matches IS 
'Stores elimination bracket matches - each row represents one H2H matchup';

COMMENT ON COLUMN bracket_matches.round_number IS 
'Round number: 1=First round, 2=Quarters, 3=Semis, 4=Finals (varies by bracket size)';

COMMENT ON COLUMN bracket_matches.next_match_id IS 
'Match ID that winner advances to - NULL for finals';
