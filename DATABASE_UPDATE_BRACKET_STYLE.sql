-- ============================================
-- ADD BRACKET_STYLE FIELD TO TOURNAMENTS
-- ============================================
-- Run this to add the bracket style option

-- Add bracket_style column
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS bracket_style VARCHAR(20) DEFAULT 'scoreboard';

-- Add check constraint for valid values
ALTER TABLE tournaments
DROP CONSTRAINT IF EXISTS tournaments_bracket_style_check;

ALTER TABLE tournaments
ADD CONSTRAINT tournaments_bracket_style_check 
CHECK (bracket_style IN ('scoreboard', 'head-to-head', 'mixed'));

-- Update existing tournaments to have a default
UPDATE tournaments 
SET bracket_style = 'scoreboard' 
WHERE bracket_style IS NULL;

-- Add comments
COMMENT ON COLUMN tournaments.bracket_style IS 
'Bracket display style: scoreboard (points/leaderboard), head-to-head (elimination tree), mixed (FFA then bracket)';

-- ============================================
-- SUMMARY
-- ============================================
-- ✅ Added bracket_style field with 3 options:
--    - scoreboard: Points-based leaderboard only (e.g., racing)
--    - head-to-head: Elimination bracket tree only (e.g., 1v1 battles)
--    - mixed: FFA rounds first, then top X advance to bracket (e.g., RIVALS)
