// Bracket Management Logic for Admin Panel
// Handles bracket generation, seeding, and match management

(function() {
  'use strict';

  let currentTournament = null;
  let tournaments = [];
  let participants = [];
  let bracketMatches = [];

  // Initialize bracket management
  window.initBracketManagement = function() {
    loadTournaments();
    setupEventListeners();
  };

  function setupEventListeners() {
    const tournamentSelect = document.getElementById('bracketTournament');
    const generateBtn = document.getElementById('generateBracketBtn');
    const viewBtn = document.getElementById('viewBracketBtn');
    const deleteBtn = document.getElementById('deleteBracketBtn');
    const confirmGenerateBtn = document.getElementById('confirmGenerateBracket');
    const cancelGenerateBtn = document.getElementById('cancelGenerateBracket');
    const refreshBtn = document.getElementById('refreshBracket');

    if (tournamentSelect) {
      tournamentSelect.addEventListener('change', handleTournamentSelect);
    }

    if (generateBtn) {
      generateBtn.addEventListener('click', showGenerateForm);
    }

    if (viewBtn) {
      viewBtn.addEventListener('click', loadAndDisplayBracket);
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', deleteBracket);
    }

    if (confirmGenerateBtn) {
      confirmGenerateBtn.addEventListener('click', generateBracket);
    }

    if (cancelGenerateBtn) {
      cancelGenerateBtn.addEventListener('click', hideGenerateForm);
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', loadAndDisplayBracket);
    }

    const bracketContainer = document.getElementById('bracketMatchesContainer');
    if (bracketContainer) {
      bracketContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-match-btn');
        if (editBtn) {
          e.preventDefault();
          openEditMatchModal(editBtn.dataset.matchId);
        }
      });
    }

    document.querySelectorAll('.close-edit-match-modal').forEach(btn => {
      btn.addEventListener('click', () => hideEditMatchModal());
    });
    const saveEditMatchBtn = document.getElementById('saveEditMatchBtn');
    if (saveEditMatchBtn) saveEditMatchBtn.addEventListener('click', saveEditMatch);
  }

  // ============================================
  // LOAD TOURNAMENTS
  // ============================================
  
  async function loadTournaments() {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      return;
    }

    const supabase = window.supabaseConfig.supabase;

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tournaments:', error);
        return;
      }

      tournaments = data || [];
      populateTournamentDropdown();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function populateTournamentDropdown() {
    const select = document.getElementById('bracketTournament');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select Tournament --</option>';

    const bracketTournaments = tournaments.filter(t => {
      const style = (t.bracket_style || 'scoreboard').toLowerCase();
      return style === 'head-to-head' || style === 'mixed';
    });

    if (bracketTournaments.length === 0) {
      select.innerHTML += '<option value="" disabled>No Mixed/Head-to-Head tournaments</option>';
      return;
    }

    bracketTournaments.forEach(t => {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = `${t.name_en} (${t.bracket_style})`;
      select.appendChild(option);
    });
  }

  // ============================================
  // TOURNAMENT SELECTION
  // ============================================
  
  async function handleTournamentSelect(event) {
    const tournamentId = event.target.value;

    if (!tournamentId) {
      hideAllSections();
      return;
    }

    currentTournament = tournaments.find(t => t.id === tournamentId);
    if (!currentTournament) return;

    // Hide any previously viewed bracket so we don't show the wrong tournament's bracket
    document.getElementById('bracketDisplay').classList.add('hidden');
    bracketMatches = [];

    // Check if tournament supports brackets
    const bracketStyle = currentTournament.bracket_style || 'scoreboard';
    if (bracketStyle === 'scoreboard') {
      document.getElementById('bracketStatus').classList.add('hidden');
      document.getElementById('bracketScoreboardWarning').classList.remove('hidden');
      document.getElementById('bracketActions').classList.add('hidden');
      return;
    }

    document.getElementById('bracketScoreboardWarning').classList.add('hidden');

    await loadTournamentData();
    showBracketStatus();
    await checkBracketExists();
  }

  async function loadTournamentData() {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      return;
    }

    const supabase = window.supabaseConfig.supabase;
    const TABLES = window.supabaseConfig.TABLES;

    try {
      // Load participants using tournament_id
      const { data: parts, error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .select('*')
        .eq('tournament_id', currentTournament.id)
        .order('signup_timestamp', { ascending: true });

      if (error) {
        console.error('Error loading participants:', error);
        return;
      }

      participants = parts || [];
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function checkBracketExists() {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      return;
    }

    const supabase = window.supabaseConfig.supabase;

    try {
      const { data, error } = await supabase
        .from('bracket_matches')
        .select('*')
        .eq('tournament_id', currentTournament.id)
        .limit(1);

      if (error) {
        console.error('Error checking bracket:', error);
        return;
      }

      if (data && data.length > 0) {
        // Bracket exists
        showBracketActions(true);
        document.getElementById('bracketCurrentStatus').textContent = 'Bracket Generated ✓';
      } else {
        // No bracket
        showBracketActions(false);
        document.getElementById('bracketCurrentStatus').textContent = 'Not Generated';
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function showBracketStatus() {
    document.getElementById('bracketStatus').classList.remove('hidden');
    document.getElementById('bracketTournamentName').textContent = currentTournament.name_en;
    document.getElementById('bracketStyleDisplay').textContent = currentTournament.bracket_style;
    document.getElementById('bracketTotalParticipants').textContent = participants.length;
  }

  function showBracketActions(bracketExists) {
    const actions = document.getElementById('bracketActions');
    const generateBtn = document.getElementById('generateBracketBtn');
    const viewBtn = document.getElementById('viewBracketBtn');
    const deleteBtn = document.getElementById('deleteBracketBtn');

    actions.classList.remove('hidden');

    if (bracketExists) {
      generateBtn.style.display = 'none';
      viewBtn.style.display = 'inline-block';
      deleteBtn.style.display = 'inline-block';
    } else {
      generateBtn.style.display = 'inline-block';
      viewBtn.style.display = 'none';
      deleteBtn.style.display = 'none';
    }

    document.getElementById('bracketEmpty').classList.add('hidden');
  }

  function hideAllSections() {
    document.getElementById('bracketStatus').classList.add('hidden');
    document.getElementById('bracketScoreboardWarning').classList.add('hidden');
    document.getElementById('bracketActions').classList.add('hidden');
    document.getElementById('generateBracketForm').classList.add('hidden');
    document.getElementById('bracketDisplay').classList.add('hidden');
    document.getElementById('bracketEmpty').classList.remove('hidden');
  }

  // ============================================
  // GENERATE BRACKET
  // ============================================
  
  function showGenerateForm() {
    document.getElementById('generateBracketForm').classList.remove('hidden');
    
    // Set default bracket size based on participants
    const sizeInput = document.getElementById('bracketSize');
    const participantCount = participants.length;

    // Default to all participants or suggest power of 2
    if (participantCount <= 4) {
      sizeInput.value = 4;
    } else if (participantCount <= 8) {
      sizeInput.value = 8;
    } else if (participantCount <= 16) {
      sizeInput.value = 16;
    } else if (participantCount <= 32) {
      sizeInput.value = 32;
    } else {
      sizeInput.value = participantCount; // Or all of them
    }
  }

  function hideGenerateForm() {
    document.getElementById('generateBracketForm').classList.add('hidden');
  }

  async function generateBracket() {
    const seedingMethod = document.getElementById('seedingMethod').value;
    const desiredBracketSize = parseInt(document.getElementById('bracketSize').value);
    const totalParticipants = participants.length;

    // Validation
    if (!desiredBracketSize || desiredBracketSize < 2) {
      alert('Please enter a valid number of players (minimum 2)');
      return;
    }

    if (totalParticipants < 2) {
      alert('Need at least 2 participants to generate a bracket!');
      return;
    }

    if (desiredBracketSize > totalParticipants) {
      alert(`Cannot advance ${desiredBracketSize} players - only ${totalParticipants} participants registered!`);
      return;
    }

    if (!confirm(`Generate bracket with TOP ${desiredBracketSize} players?\n\n` +
      `Total participants: ${totalParticipants}\n` +
      `Round 1: ${Math.ceil(desiredBracketSize / 2)} match${Math.ceil(desiredBracketSize / 2) === 1 ? '' : 'es'} (1 vs ${desiredBracketSize}, 2 vs ${desiredBracketSize - 1}, etc.)`)) {
      return;
    }

    // Get top N seeded participants (by signup order, points, or random)
    let allSeededParticipants = await getSeededParticipants(desiredBracketSize, seedingMethod);

    if (!allSeededParticipants || allSeededParticipants.length === 0) {
      alert('Error generating bracket: Could not seed participants');
      return;
    }

    // Use exactly the seeded list (already top N with seeds 1..N)
    const topPlayers = allSeededParticipants;
    
    console.log(`Selected top ${topPlayers.length} players for bracket:`, topPlayers.map(p => p.roblox_username));

    // Generate bracket: N players, no padding. Round 1 = 1 vs N, 2 vs N-1, 3 vs N-2, ...
    const matches = createBracketStructure(topPlayers, desiredBracketSize);

    // Save to database
    await saveBracketMatches(matches);

    hideGenerateForm();
    await checkBracketExists();
    await loadAndDisplayBracket();

    alert(`✓ Bracket generated successfully!\n\nTop ${desiredBracketSize} of ${totalParticipants} participants\nRound 1: ${Math.ceil(desiredBracketSize / 2)} match${Math.ceil(desiredBracketSize / 2) === 1 ? '' : 'es'}`);
  }

  async function getSeededParticipants(bracketSize, method) {
    let seeded = [...participants];

    if (method === 'points') {
      // Seed by points from FFA rounds (matches table)
      seeded = await seedByPoints(participants);
    } else if (method === 'random') {
      // Random shuffle
      seeded = shuffleArray(seeded);
    }
    // else 'manual' - use signup order

    // Take top N participants
    return seeded.slice(0, bracketSize).map((p, index) => ({
      ...p,
      seed: index + 1
    }));
  }

  async function seedByPoints(participants) {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      return participants;
    }

    const supabase = window.supabaseConfig.supabase;
    const TABLES = window.supabaseConfig.TABLES;

    try {
      // Get all match results for this tournament using tournament_id
      const { data: matches, error } = await supabase
        .from(TABLES.MATCHES)
        .select('*')
        .eq('tournament_id', currentTournament.id);

      if (error) {
        console.error('Error fetching matches for seeding:', error);
        console.warn('No match results found, using signup order');
        return participants;
      }

      if (!matches || matches.length === 0) {
        console.warn('No match results found, using signup order');
        return participants;
      }

      console.log(`Found ${matches.length} matches for seeding calculation`);

      // Calculate total points per participant from scores object
      const pointsMap = {};
      participants.forEach(p => {
        pointsMap[p.id] = 0;
      });

      matches.forEach(match => {
        if (match.scores) {
          Object.entries(match.scores).forEach(([username, scoreData]) => {
            const participant = participants.find(p => p.roblox_username === username);
            if (participant && pointsMap[participant.id] !== undefined) {
              pointsMap[participant.id] += scoreData.points || 0;
            }
          });
        }
      });

      // Sort by points descending
      return participants.sort((a, b) => {
        return (pointsMap[b.id] || 0) - (pointsMap[a.id] || 0);
      });
    } catch (error) {
      console.error('Error seeding by points:', error);
      return participants;
    }
  }

  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Create bracket for N players (no padding to power of 2).
   * Round 1: 1 vs N, 2 vs N-1, ... If N odd, seed 1 gets a bye (match 1 = 1 vs bye).
   * When round 1 has odd winners (e.g. 5 → 3 games): round 2 has 2 matches (semifinal + final);
   * bye winner goes into the final (R2M2), other two winners play the semifinal (R2M1).
   */
  function createBracketStructure(seededParticipants, numPlayers) {
    const matches = [];
    const n = numPlayers;
    const M1 = Math.ceil(n / 2); // round 1 match count
    const isOdd = n % 2 === 1;

    // Round 1: match 1 = 1 vs (bye if odd, else n). Match i>1: seed i vs seed n+2-i (so 2 vs n, 3 vs n-1, ...)
    for (let i = 1; i <= M1; i++) {
      const seed1 = i;
      const isBye = isOdd && i === 1; // seed 1 gets bye when n is odd
      const seed2 = isBye ? null : (i === 1 ? n : n + 2 - i);
      const player1 = seed1 <= n ? seededParticipants[seed1 - 1] : null;
      const player2 = !isBye && seed2 && seed2 <= n ? seededParticipants[seed2 - 1] : null;

      let matchStatus = 'pending';
      let winnerId = null;
      if (isBye && player1) {
        matchStatus = 'completed';
        winnerId = player1.id;
      } else if (!player1 && player2) {
        matchStatus = 'completed';
        winnerId = player2.id;
      } else if (player1 && !player2) {
        matchStatus = 'completed';
        winnerId = player1.id;
      }

      matches.push({
        round_number: 1,
        match_number: i,
        player1_id: player1 ? player1.id : null,
        player2_id: player2 ? player2.id : null,
        player1_seed: player1 ? player1.seed : null,
        player2_seed: player2 ? player2.seed : null,
        winner_id: winnerId,
        match_status: matchStatus
      });
    }

    // Build subsequent rounds. When W1 is odd (e.g. 5 → 3 winners): round 2 has 2 matches only (no round 3).
    // When 4 players in semis (W=2): add final + third-place match.
    let W = M1;
    let round = 2;
    while (W > 1) {
      let matchesInRound = W === 3 ? 2 : Math.floor(W / 2);
      const isFinalRound = W === 2; // 2 semifinal winners → final round; also add 3rd place match
      if (isFinalRound) matchesInRound = 2; // match 1 = final, match 2 = 3rd place playoff
      for (let i = 1; i <= matchesInRound; i++) {
        matches.push({
          round_number: round,
          match_number: i,
          player1_id: null,
          player2_id: null,
          player1_seed: null,
          player2_seed: null,
          winner_id: null,
          match_status: 'pending'
        });
      }
      if (W === 3) break; // only 2 rounds: bye winner in R2M2, other two in R2M1
      if (isFinalRound) break; // final + 3rd place created; no further rounds
      W = Math.floor(W / 2) + (W % 2);
      round++;
    }

    linkMatches(matches);
    advanceWinnersIntoNextRound(matches);

    return matches;
  }

  /** Fill next-round slots. When M1 is odd (e.g. 5): R1M1 (bye) → R2M2 player1; R1M2 → R2M1 player1; R1M3 → R2M1 player2. */
  function advanceWinnersIntoNextRound(matches) {
    const round1Matches = matches.filter(m => m.round_number === 1).sort((a, b) => a.match_number - b.match_number);
    const M1 = round1Matches.length;
    const hasOddR1 = M1 % 2 === 1;

    round1Matches.forEach(r1Match => {
      if (!r1Match.winner_id) return;
      const i = r1Match.match_number;

      if (hasOddR1) {
        // 3 round-1 matches: bye winner (match 1) → R2 match 2 player1; matches 2 and 3 → R2 match 1
        if (i === 1) {
          const r2m2 = matches.find(m => m.round_number === 2 && m.match_number === 2);
          if (r2m2) r2m2.player1_id = r1Match.winner_id;
        } else {
          const r2m1 = matches.find(m => m.round_number === 2 && m.match_number === 1);
          if (r2m1) {
            if (i === 2) r2m1.player1_id = r1Match.winner_id;
            else r2m1.player2_id = r1Match.winner_id;
          }
        }
        return;
      }

      const nextMatchNumber = Math.ceil(i / 2);
      const nextMatch = matches.find(m => m.round_number === 2 && m.match_number === nextMatchNumber);
      if (!nextMatch) return;
      if (i % 2 === 1) nextMatch.player1_id = r1Match.winner_id;
      else nextMatch.player2_id = r1Match.winner_id;
    });
  }

  function linkMatches(matches) {
    const round1Matches = matches.filter(m => m.round_number === 1);
    const M1 = round1Matches.length;
    const hasOddR1 = M1 % 2 === 1;

    matches.forEach((match) => {
      const round = match.round_number;
      const matchNum = match.match_number;

      if (round === 1) {
        if (hasOddR1) {
          // Bye winner (match 1) → R2M2; matches 2 and 3 → R2M1
          if (matchNum === 1) {
            const r2m2 = matches.find(m => m.round_number === 2 && m.match_number === 2);
            if (r2m2) match.next_match_id = r2m2.id || 'temp_2_2';
          } else {
            const r2m1 = matches.find(m => m.round_number === 2 && m.match_number === 1);
            if (r2m1) match.next_match_id = r2m1.id || 'temp_2_1';
          }
        } else {
          const nextMatchNumber = Math.ceil(matchNum / 2);
          const nextMatch = matches.find(m => m.round_number === 2 && m.match_number === nextMatchNumber);
          if (nextMatch) match.next_match_id = nextMatch.id || `temp_2_${nextMatchNumber}`;
        }
        return;
      }

      // Round 2: if there are 2 matches in round 2 (5-player bracket), R2M1 winner → R2M2
      const nextRoundMatches = matches.filter(m => m.round_number === round + 1);
      if (nextRoundMatches.length > 0) {
        const nextMatchNumber = Math.ceil(matchNum / 2);
        const nextMatch = nextRoundMatches.find(m => m.match_number === nextMatchNumber);
        if (nextMatch) {
          match.next_match_id = nextMatch.id || `temp_${round + 1}_${nextMatchNumber}`;
        }
      } else if (round === 2 && matchNum === 1) {
        // Only 2 rounds (e.g. 5 players): R2M1 winner goes to R2M2
        const r2m2 = matches.find(m => m.round_number === 2 && m.match_number === 2);
        if (r2m2) match.next_match_id = r2m2.id || 'temp_2_2';
      }
    });
  }

  async function saveBracketMatches(matches) {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      return;
    }

    const supabase = window.supabaseConfig.supabase;

    try {
      // Keep original matches with temp IDs for reference
      const originalMatches = [...matches];
      
      // Add tournament_id and remove temp next_match_id for initial insert
      const matchesWithTournament = matches.map(m => ({
        tournament_id: currentTournament.id,
        round_number: m.round_number,
        match_number: m.match_number,
        player1_id: m.player1_id,
        player2_id: m.player2_id,
        player1_seed: m.player1_seed,
        player2_seed: m.player2_seed,
        winner_id: m.winner_id,
        match_status: m.match_status || 'pending',
        next_match_id: null // Set to null initially, will update after
      }));

      const { data, error } = await supabase
        .from('bracket_matches')
        .insert(matchesWithTournament)
        .select();

      if (error) {
        console.error('Error saving bracket:', error);
        alert('Error saving bracket: ' + error.message);
        return;
      }

      // Update next_match_id references with real IDs
      if (data && data.length > 0) {
        await updateNextMatchIds(data, originalMatches);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving bracket');
    }
  }

  async function updateNextMatchIds(savedMatches, originalMatches) {
    const supabase = window.supabaseConfig.supabase;
    
    // Build map of temp IDs to real IDs (round_number + match_number -> real ID)
    const idMap = {};
    savedMatches.forEach(m => {
      const tempKey = `temp_${m.round_number}_${m.match_number}`;
      idMap[tempKey] = m.id;
    });

    // Build update list by matching saved matches with originals
    const updates = [];
    savedMatches.forEach((savedMatch, index) => {
      const originalMatch = originalMatches[index];
      
      // Check if original match had a next_match_id
      if (originalMatch && originalMatch.next_match_id) {
        const nextMatchIdStr = originalMatch.next_match_id.toString();
        
        // If it's a temp ID, look up the real ID
        if (nextMatchIdStr.startsWith('temp_')) {
          const realId = idMap[nextMatchIdStr];
          if (realId) {
            updates.push({
              id: savedMatch.id,
              next_match_id: realId
            });
          }
        }
      }
    });

    // Batch update
    if (updates.length > 0) {
      console.log(`Updating ${updates.length} next_match_id references...`);
      for (const update of updates) {
        await supabase
          .from('bracket_matches')
          .update({ next_match_id: update.next_match_id })
          .eq('id', update.id);
      }
      console.log('✅ Next match IDs updated successfully');
    }
  }

  // ============================================
  // DISPLAY BRACKET
  // ============================================
  
  async function loadAndDisplayBracket() {
    if (!currentTournament) return;

    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      return;
    }

    const supabase = window.supabaseConfig.supabase;

    try {
      const { data, error } = await supabase
        .from('bracket_matches')
        .select(`
          *,
          player1:participants!bracket_matches_player1_id_fkey(roblox_username, roblox_display_name, roblox_avatar_url),
          player2:participants!bracket_matches_player2_id_fkey(roblox_username, roblox_display_name, roblox_avatar_url),
          winner:participants!bracket_matches_winner_id_fkey(roblox_username, roblox_display_name, roblox_avatar_url)
        `)
        .eq('tournament_id', currentTournament.id)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (error) {
        console.error('Error loading bracket:', error);
        return;
      }

      bracketMatches = data || [];
      console.log('🎯 Loaded bracket matches:', bracketMatches);
      if (bracketMatches.length > 0) {
        console.log('📋 First match structure:', bracketMatches[0]);
      }
      displayBracket();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function displayBracket() {
    const container = document.getElementById('bracketMatchesContainer');
    if (!container) return;

    document.getElementById('bracketDisplay').classList.remove('hidden');

    // Group matches by round
    const rounds = {};
    bracketMatches.forEach(match => {
      if (!rounds[match.round_number]) {
        rounds[match.round_number] = [];
      }
      rounds[match.round_number].push(match);
    });

    let html = '';

    Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b)).forEach(roundNum => {
      const matches = rounds[roundNum];
      const roundKey = getRoundNameKey(parseInt(roundNum), Object.keys(rounds).length);
      const roundName = getRoundName(parseInt(roundNum), Object.keys(rounds).length);
      const roundTitleHtml = roundKey === 'bracket.round'
        ? roundName
        : `<span data-i18n="${roundKey}">${roundName}</span>`;

      html += `
        <div style="margin-bottom: 2rem;">
          <h4 style="color: #28724f; margin-bottom: 1rem;">${roundTitleHtml}</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
      `;

      matches.forEach(match => {
        html += renderMatch(match);
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.i18n && window.i18n.updateAllText) window.i18n.updateAllText();

    // Add event listeners for winner selection
    document.querySelectorAll('.select-winner-btn').forEach(btn => {
      btn.addEventListener('click', handleSelectWinner);
    });
  }

  function getRoundNameKey(roundNum, totalRounds) {
    const remaining = totalRounds - roundNum + 1;
    if (remaining === 1) return 'bracket.finals';
    if (remaining === 2) return 'bracket.semifinals';
    if (remaining === 3) return 'bracket.quarterFinals';
    if (remaining === 4) return 'bracket.roundOf16';
    if (remaining === 5) return 'bracket.roundOf32';
    return 'bracket.round';
  }

  function getRoundName(roundNum, totalRounds) {
    const remaining = totalRounds - roundNum + 1;
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    if (remaining === 1) return t('bracket.finals');
    if (remaining === 2) return t('bracket.semifinals');
    if (remaining === 3) return t('bracket.quarterFinals');
    if (remaining === 4) return t('bracket.roundOf16');
    if (remaining === 5) return t('bracket.roundOf32');
    return t('bracket.round') + ' ' + roundNum;
  }

  function getParticipantUsername(participantField) {
    if (!participantField) return null;
    const p = Array.isArray(participantField) ? participantField[0] : participantField;
    return p && p.roblox_username ? p.roblox_username : null;
  }

  function getParticipantDisplay(participantField) {
    if (!participantField) return { name: null, avatarUrl: null };
    const p = Array.isArray(participantField) ? participantField[0] : participantField;
    if (!p) return { name: null, avatarUrl: null };
    const name = (p.roblox_display_name || p.roblox_username || '').trim() || null;
    const avatarUrl = p.roblox_avatar_url || null;
    return { name, avatarUrl };
  }

  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  const ROW_AVATAR_STYLE = 'width:32px;height:32px;min-width:32px;min-height:32px;border-radius:50%;object-fit:cover;border:2px solid rgba(0,0,0,0.1);box-sizing:border-box;display:block;flex-shrink:0';
  const ROW_PLACEHOLDER_STYLE = 'width:32px;height:32px;min-width:32px;min-height:32px;border-radius:50%;border:2px solid rgba(0,0,0,0.1);box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;font-size:1rem;background:#e8ece9;flex-shrink:0';
  const AVATAR_PLACEHOLDER = '<div style="' + ROW_PLACEHOLDER_STYLE + '">🎮</div>';
  function renderParticipantWithAvatar(display, fallback) {
    const name = display.name || fallback || 'TBD';
    const avatar = display.avatarUrl
      ? '<img width="32" height="32" src="' + escapeHtml(display.avatarUrl) + '" alt="" loading="lazy" style="' + ROW_AVATAR_STYLE + '" />'
      : AVATAR_PLACEHOLDER;
    return avatar + '<span class="player-name">' + escapeHtml(name) + '</span>';
  }

  function renderMatch(match) {
    const p1 = getParticipantDisplay(match.player1);
    const p2 = getParticipantDisplay(match.player2);
    const winner = getParticipantDisplay(match.winner);
    const player1Name = p1.name || 'TBD';
    const player2Name = p2.name || 'TBD';
    const winnerName = winner.name;

    const isCompleted = match.match_status === 'completed' || match.winner_id;
    const canSelect = match.player1_id && match.player2_id && !isCompleted;

    return `
      <div class="bracket-match ${isCompleted ? 'completed' : ''}" style="background: white; border: 2px solid ${isCompleted ? '#6ab04c' : '#e0e0e0'}; border-radius: 8px; padding: 1rem;">
        <div style="margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.875rem; color: #666; font-weight: 600;">Match ${match.match_number}</span>
          <button type="button" class="btn btn-outline edit-match-btn" data-match-id="${match.id}" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">✏️ Edit</button>
        </div>
        
        <div style="margin-bottom: 0.5rem;">
          <div class="bracket-player ${winnerName === player1Name ? 'winner' : winnerName ? 'loser' : ''}" style="padding: 0.5rem; border-radius: 4px; ${winnerName === player1Name ? 'background: #6ab04c20;' : ''}">
            ${match.player1_seed ? `<span style="background: #28724f; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.5rem;">${match.player1_seed}</span>` : ''}
            <span class="bracket-player-inner">${renderParticipantWithAvatar(p1, 'TBD')}</span>
            ${winnerName === player1Name ? ' ✓' : ''}
          </div>
        </div>

        <div style="text-align: center; margin: 0.5rem 0; color: #999; font-weight: 600;">VS</div>

        <div style="margin-bottom: 0.5rem;">
          <div class="bracket-player ${winnerName === player2Name ? 'winner' : winnerName ? 'loser' : ''}" style="padding: 0.5rem; border-radius: 4px; ${winnerName === player2Name ? 'background: #6ab04c20;' : ''}">
            ${match.player2_seed ? `<span style="background: #28724f; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; margin-right: 0.5rem;">${match.player2_seed}</span>` : ''}
            <span class="bracket-player-inner">${renderParticipantWithAvatar(p2, 'TBD')}</span>
            ${winnerName === player2Name ? ' ✓' : ''}
          </div>
        </div>

        ${canSelect ? `
          <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
            <button class="btn btn-primary select-winner-btn" data-match-id="${match.id}" data-winner-id="${match.player1_id}" style="flex: 1; padding: 0.5rem; font-size: 0.875rem;">
              ${escapeHtml(player1Name)} Wins
            </button>
            <button class="btn btn-secondary select-winner-btn" data-match-id="${match.id}" data-winner-id="${match.player2_id}" style="flex: 1; padding: 0.5rem; font-size: 0.875rem;">
              ${escapeHtml(player2Name)} Wins
            </button>
          </div>
        ` : isCompleted ? `
          <div style="margin-top: 1rem; text-align: center; color: #6ab04c; font-weight: 700;">
            Winner: ${escapeHtml(winnerName)}
          </div>
        ` : `
          <div style="margin-top: 1rem; text-align: center; color: #999; font-style: italic;">
            Waiting for previous matches
          </div>
        `}
      </div>
    `;
  }

  async function handleSelectWinner(event) {
    const matchId = event.target.dataset.matchId;
    const winnerId = event.target.dataset.winnerId;

    if (!matchId || !winnerId) return;

    await updateMatchWinner(matchId, winnerId);
  }

  async function updateMatchWinner(matchId, winnerId) {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      return;
    }

    const supabase = window.supabaseConfig.supabase;

    try {
      // Update match with winner
      const { data: updatedMatch, error } = await supabase
        .from('bracket_matches')
        .update({
          winner_id: winnerId,
          match_status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) {
        console.error('Error updating match:', error);
        alert('Error updating match');
        return;
      }

      // Advance winner to next match
      if (updatedMatch.next_match_id) {
        await advanceWinner(updatedMatch.next_match_id, winnerId);
      }

      // If this was a semifinal (next match is final), send loser to 3rd place match
      const loserId = updatedMatch.player1_id === winnerId ? updatedMatch.player2_id : updatedMatch.player1_id;
      if (loserId && updatedMatch.next_match_id) {
        const { data: nextMatch } = await supabase.from('bracket_matches').select('round_number').eq('id', updatedMatch.next_match_id).single();
        if (nextMatch) {
          const { data: thirdPlaceRows } = await supabase.from('bracket_matches').select('id').eq('tournament_id', currentTournament.id).eq('round_number', nextMatch.round_number).eq('match_number', 2);
          if (thirdPlaceRows && thirdPlaceRows.length > 0) {
            const slot = updatedMatch.match_number === 1 ? 'player1_id' : 'player2_id';
            await supabase.from('bracket_matches').update({ [slot]: loserId }).eq('id', thirdPlaceRows[0].id);
          }
        }
      }

      // Reload bracket
      await loadAndDisplayBracket();
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating match');
    }
  }

  async function advanceWinner(nextMatchId, winnerId) {
    const supabase = window.supabaseConfig.supabase;

    try {
      // Get next match
      const { data: nextMatch, error: fetchError } = await supabase
        .from('bracket_matches')
        .select('*')
        .eq('id', nextMatchId)
        .single();

      if (fetchError || !nextMatch) {
        console.error('Error fetching next match:', fetchError);
        return;
      }

      // Determine which player slot to fill
      const updates = {};
      if (!nextMatch.player1_id) {
        updates.player1_id = winnerId;
      } else if (!nextMatch.player2_id) {
        updates.player2_id = winnerId;
      } else {
        console.warn('Next match already has both players');
        return;
      }

      // Update next match
      const { error: updateError } = await supabase
        .from('bracket_matches')
        .update(updates)
        .eq('id', nextMatchId);

      if (updateError) {
        console.error('Error advancing winner:', updateError);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // ============================================
  // EDIT BRACKET MATCH (manual edit)
  // ============================================

  function openEditMatchModal(matchId) {
    const match = bracketMatches.find(m => m.id === matchId);
    if (!match) return;

    const modal = document.getElementById('editBracketMatchModal');
    const idInput = document.getElementById('editMatchId');
    const p1Select = document.getElementById('editMatchPlayer1');
    const p2Select = document.getElementById('editMatchPlayer2');
    const winnerSelect = document.getElementById('editMatchWinner');
    if (!modal || !idInput || !p1Select || !p2Select || !winnerSelect) return;

    idInput.value = matchId;

    function participantLabel(p) {
      const name = (p.roblox_display_name || p.roblox_username || '').trim() || p.roblox_username || 'Unknown';
      return name;
    }

    const optionsHtml = '<option value="">— No player —</option>' +
      participants.map(p => `<option value="${p.id}">${escapeHtml(participantLabel(p))}</option>`).join('');

    p1Select.innerHTML = optionsHtml;
    p2Select.innerHTML = optionsHtml;
    p1Select.value = match.player1_id || '';
    p2Select.value = match.player2_id || '';

    winnerSelect.innerHTML =
      '<option value="">— Not decided —</option>' +
      '<option value="player1">Player 1 wins</option>' +
      '<option value="player2">Player 2 wins</option>';
    if (match.winner_id) {
      if (match.winner_id === match.player1_id) winnerSelect.value = 'player1';
      else if (match.winner_id === match.player2_id) winnerSelect.value = 'player2';
      else winnerSelect.value = '';
    } else {
      winnerSelect.value = '';
    }

    modal.classList.remove('hidden');
  }

  function hideEditMatchModal() {
    const modal = document.getElementById('editBracketMatchModal');
    if (modal) modal.classList.add('hidden');
  }

  async function saveEditMatch() {
    const idInput = document.getElementById('editMatchId');
    const p1Select = document.getElementById('editMatchPlayer1');
    const p2Select = document.getElementById('editMatchPlayer2');
    const winnerSelect = document.getElementById('editMatchWinner');
    if (!idInput || !p1Select || !p2Select || !winnerSelect) return;

    const matchId = idInput.value;
    const match = bracketMatches.find(m => m.id === matchId);
    if (!match || !window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) return;

    const player1Id = p1Select.value || null;
    const player2Id = p2Select.value || null;
    let winnerId = null;
    if (winnerSelect.value === 'player1') winnerId = player1Id;
    else if (winnerSelect.value === 'player2') winnerId = player2Id;

    const supabase = window.supabaseConfig.supabase;

    try {
      const { data: updatedMatch, error } = await supabase
        .from('bracket_matches')
        .update({
          player1_id: player1Id,
          player2_id: player2Id,
          winner_id: winnerId,
          match_status: winnerId ? 'completed' : 'pending'
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) {
        console.error('Error updating match:', error);
        alert('Error updating match');
        return;
      }

      // If this match feeds a next match, set that slot to the winner
      if (winnerId && updatedMatch.next_match_id) {
        const slot = match.match_number % 2 === 1 ? 'player1_id' : 'player2_id';
        await supabase
          .from('bracket_matches')
          .update({ [slot]: winnerId })
          .eq('id', updatedMatch.next_match_id);
      }

      hideEditMatchModal();
      await loadAndDisplayBracket();
      alert('✓ Match updated');
    } catch (err) {
      console.error('Error saving match:', err);
      alert('Error updating match');
    }
  }

  // ============================================
  // DELETE BRACKET
  // ============================================
  
  async function deleteBracket() {
    if (!confirm('Delete entire bracket? This cannot be undone!')) {
      return;
    }

    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      return;
    }

    const supabase = window.supabaseConfig.supabase;

    try {
      const { error } = await supabase
        .from('bracket_matches')
        .delete()
        .eq('tournament_id', currentTournament.id);

      if (error) {
        console.error('Error deleting bracket:', error);
        alert('Error deleting bracket');
        return;
      }

      document.getElementById('bracketDisplay').classList.add('hidden');
      await checkBracketExists();
      
      alert('✓ Bracket deleted successfully');
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting bracket');
    }
  }

})();
