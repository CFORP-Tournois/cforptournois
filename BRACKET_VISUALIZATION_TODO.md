# Bracket Visualization System - Future Enhancement

## Current Status

✅ **Basic Functionality Complete:**
- Participant list display
- Results entry system (placement-based)
- Points calculation
- Leaderboard display

❌ **Not Yet Implemented:**
- Visual bracket display for elimination rounds
- FFA → Elimination transition system

---

## Requirements

### FFA/Elimination Hybrid Format (e.g., RIVALS)

1. **Phase 1: Free-For-All Rounds**
   - Multiple FFA rounds (3 rounds × 8 minutes each)
   - Players earn points based on placement (1st = 100pts, 2nd = 80pts, etc.)
   - All results entered via current "Enter Results" system ✅
   - Leaderboard shows cumulative points ✅

2. **Phase 2: Elimination Bracket** (NOT YET IMPLEMENTED)
   - Top X players advance to elimination bracket
   - 1v1 matches in bracket format
   - Winner advances, loser eliminated
   - Need visual bracket display

### Racing Format (e.g., Ultimate Driving)

- **Points-based only** (no bracket needed)
- Multiple timed races
- Cumulative leaderboard
- Current system handles this perfectly ✅

---

## Technical Implementation Plan

### Option 1: Use brackets-viewer.js Library

**Library:** https://github.com/Drarig29/brackets-viewer.js

**Pros:**
- Professional bracket rendering
- Handles single/double elimination
- Interactive bracket updates
- Mobile responsive

**Cons:**
- Additional dependency (~50KB)
- Learning curve for configuration
- May be overkill for simple brackets

**Implementation:**
```html
<!-- Add to bracket.html -->
<script src="https://cdn.jsdelivr.net/npm/brackets-viewer@latest/dist/brackets-viewer.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/brackets-viewer@latest/dist/brackets-viewer.min.css">

<div id="bracket-container"></div>
```

```javascript
// In bracket.js
bracketsViewer.render({
  stages: [
    {
      id: 1,
      tournament_id: 1,
      name: "Elimination Bracket",
      type: "single_elimination",
      number: 1,
      settings: {
        size: 8  // Top 8 from FFA advance
      }
    }
  ],
  matches: [
    // Generate from top FFA finishers
  ],
  participants: [
    // Top 8 players from leaderboard
  ]
});
```

### Option 2: Custom CSS Grid Bracket

**Pros:**
- Full control
- Lightweight
- Matches your branding
- No dependencies

**Cons:**
- More development time
- Need to handle responsive design
- Manual bracket logic

**CSS Structure:**
```css
.bracket {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 rounds */
  gap: 1rem;
}

.bracket-round {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.bracket-match {
  background: white;
  border-radius: 8px;
  padding: 1rem;
}
```

---

## Database Schema Addition (Future)

When implementing brackets, add:

```sql
CREATE TABLE bracket_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id),
  round_number INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES participants(id),
  player2_id UUID REFERENCES participants(id),
  winner_id UUID REFERENCES participants(id),
  player1_seed INTEGER,
  player2_seed INTEGER,
  match_status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

---

## Admin Panel Enhancement (Future)

Add "Bracket Management" tab:
```
1. FFA Rounds (current system) ✅
2. Generate Bracket (NEW)
   - Select top X players from leaderboard
   - Auto-generate bracket seeding
   - Initialize bracket matches

3. Update Bracket (NEW)
   - Select match
   - Enter winner
   - Bracket automatically updates
```

---

## Workflow for Admin

### Current Workflow (FFA Only):
1. Players register ✅
2. Admin runs FFA rounds ✅
3. Admin enters placements ✅
4. Leaderboard updates ✅

### Future Workflow (FFA + Elimination):
1. Players register ✅
2. Admin runs FFA rounds ✅
3. Admin enters placements ✅
4. **NEW:** Admin clicks "Generate Bracket"
5. **NEW:** System takes top 8/16 players
6. **NEW:** Creates seeded bracket
7. **NEW:** Admin enters 1v1 match winners
8. **NEW:** Bracket updates visually
9. **NEW:** Final winner crowned

---

## Timeline & Priority

**Priority:** Medium (works fine without it)
**Complexity:** High
**Estimated Time:** 8-12 hours

**Recommended Approach:**
1. ✅ Get current system working perfectly (DONE)
2. ✅ Test with real tournaments using FFA/points only (IN PROGRESS)
3. ❌ Gather user feedback on bracket needs
4. ❌ Choose library vs custom approach
5. ❌ Implement bracket visualization
6. ❌ Add bracket management to admin panel

---

## Notes

- The current points-based system works great for most tournaments
- Bracket visualization is "nice to have" but not essential
- Can be added later without breaking existing functionality
- May want to wait until after first real tournament to see actual needs
- Consider whether manual bracket (external tool) is sufficient for now

---

## Quick Win Alternative

**For now, use external bracket tool:**
1. Run FFA rounds with current system ✅
2. Export top players from leaderboard
3. Use Challonge.com or Bracket HQ to generate bracket
4. Share bracket link with participants
5. Enter final results back into system

This keeps development simple while providing bracket functionality.

---

**Decision:** Implement brackets AFTER first tournament, based on actual user needs.
