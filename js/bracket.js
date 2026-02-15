// Bracket Display Logic for AFNOO Tournaments
// Handles real-time bracket updates and leaderboard display

(function() {
  'use strict';

  let currentTournament = null; // Will be set to first tournament
  let realtimeSubscription = null;
  let tournaments = [];
  let currentMatches = []; // Store matches for filtering
  let currentParticipants = []; // Store participants for filtering
  let currentRoundFilter = 'overall'; // Current round filter

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', initBracketPage);

  async function initBracketPage() {
    // Single change listener for round dropdown (per-tournament options set in setupRoundFilter)
    document.getElementById('roundFilter')?.addEventListener('change', function(e) {
      currentRoundFilter = e.target.value;
      displayLeaderboard(currentParticipants, currentMatches, currentRoundFilter);
    });

    // Load tournaments first
    await loadTournaments();
    
    // Set up real-time updates if Supabase is configured
    if (window.supabaseConfig && window.supabaseConfig.isSupabaseConfigured()) {
      setupRealtimeUpdates();
    } else {
      console.warn('Supabase not configured. Real-time updates disabled.');
      // Load demo data for testing
      loadDemoData();
    }
    
    // Update timestamp
    updateTimestamp();
    setInterval(updateTimestamp, 60000); // Update every minute
  }
  
  // ============================================
  // LOAD TOURNAMENTS FROM DATABASE
  // ============================================
  
  async function loadTournaments() {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return;
    }
    
    const supabase = window.supabaseConfig.supabase;
    
    try {
      const { data, error} = await supabase
        .from('tournaments')
        .select('*')
        .in('status', ['published', 'in-progress'])  // Don't show completed tournaments in bracket view
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error loading tournaments:', error);
        return;
      }
      
      tournaments = data || [];
      
      console.log('🏆 Loaded tournaments:', tournaments);
      
      if (tournaments.length > 0) {
        renderTournamentTabs();
        // Set first tournament as current
        currentTournament = tournaments[0].tournament_type;
        console.log('🎯 Setting current tournament to:', currentTournament);
        console.log('📋 Tournament details:', tournaments[0]);
        switchTournament(currentTournament);
      } else {
        showNoTournaments();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  function renderTournamentTabs() {
    const container = document.getElementById('tournamentTabs');
    if (!container) return;
    
    const currentLang = window.i18n ? window.i18n.currentLang : 'fr';
    
    container.innerHTML = tournaments.map((tournament, index) => {
      const name = currentLang === 'fr' ? tournament.name_fr : tournament.name_en;
      const colorClass = index % 2 === 0 ? 'btn-primary' : 'btn-secondary';
      const isFirst = index === 0;
      
      return `
        <button 
          class="btn ${colorClass} tournament-tab ${isFirst ? 'active' : ''}" 
          data-tournament="${escapeHtml(tournament.tournament_type)}"
          data-tournament-id="${tournament.id}"
          style="min-width: 200px;"
        >
          ${escapeHtml(name)}
        </button>
      `;
    }).join('');
    
    // Set up tab click handlers
    setupTournamentTabs();
  }
  
  function showNoTournaments() {
    const container = document.getElementById('tournamentTabs');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: #666;">No tournaments available</p>
        </div>
      `;
    }
  }
  
  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ============================================
  // TOURNAMENT TABS
  // ============================================
  
  function setupTournamentTabs() {
    const tabs = document.querySelectorAll('.tournament-tab');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tournament = this.getAttribute('data-tournament');
        switchTournament(tournament);
      });
    });
  }
  
  function switchTournament(tournament) {
    currentTournament = tournament;
    
    // Update active tab
    document.querySelectorAll('.tournament-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-tournament="${tournament}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
    
    // Update tournament info display
    updateTournamentInfo(tournament);
    
    // Load tournament data
    loadTournamentData(tournament);
  }
  
  // Listen for language changes
  window.addEventListener('languageChanged', () => {
    if (tournaments.length > 0) {
      renderTournamentTabs();
      if (currentTournament) {
        const activeTab = document.querySelector(`[data-tournament="${currentTournament}"]`);
        if (activeTab) {
          activeTab.classList.add('active');
        }
        updateTournamentInfo(currentParticipants);
      }
      if (window.i18n && window.i18n.updateAllText) {
        window.i18n.updateAllText();
      }
    }
  });

  // ============================================
  // DATA LOADING
  // ============================================
  
  async function loadTournamentData(tournament) {
    showLoading();
    
    try {
      if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
        // Demo mode
        loadDemoData();
        return;
      }
      
      const supabase = window.supabaseConfig.supabase;
      const TABLES = window.supabaseConfig.TABLES;
      
      // Get tournament object first
      const tournamentObj = tournaments.find(t => t.tournament_type === tournament);
      if (!tournamentObj) {
        console.error('❌ Tournament object not found for:', tournament);
        showEmpty();
        return;
      }
      
      // Clear bracket immediately when switching tournaments (only re-show if this one has bracket)
      clearBracketSection();
      
      // Fetch participants for this tournament using tournament_id
      console.log('👥 Fetching participants for tournament_id:', tournamentObj.id);
      const { data: participants, error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .select('*')
        .eq('tournament_id', tournamentObj.id)
        .order('signup_timestamp', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching participants:', error);
        showEmpty();
        return;
      }
      
      console.log('✅ Found participants:', participants ? participants.length : 0, participants);
      
      if (!participants || participants.length === 0) {
        console.warn('⚠️ No participants found for tournament_id:', tournamentObj.id);
        showEmpty();
        return;
      }
      
      // Store participants globally
      currentParticipants = participants;

      // Fetch match results for leaderboard using tournament_id
      console.log('🔍 Fetching matches for tournament_id:', tournamentObj.id);
      const { data: matches, error: matchError } = await supabase
        .from(TABLES.MATCHES)
        .select('*')
        .eq('tournament_id', tournamentObj.id)
        .order('round_number', { ascending: true });

      if (matchError) {
        console.error('❌ Error fetching matches:', matchError);
      }

      console.log('📊 Found matches:', matches ? matches.length : 0);

      // Store matches globally
      currentMatches = matches || [];

      // Calculate leaderboard if we have results (round dropdown is per-tournament)
      if (matches && matches.length > 0) {
        console.log('✅ Displaying leaderboard with', matches.length, 'matches');
        currentRoundFilter = 'overall';
        setupRoundFilter(matches);
        displayLeaderboard(participants, matches, 'overall');
      } else {
        // No results yet: hide round dropdown and show participant list only
        console.log('ℹ️ No matches found - showing participant list');
        hideRoundFilter();
        displayParticipants(participants);
      }
      
      // Load bracket only if this tournament uses head-to-head or mixed (not scoreboard)
      const bracketStyle = (tournamentObj.bracket_style || 'scoreboard').toLowerCase();
      if (bracketStyle === 'head-to-head' || bracketStyle === 'mixed') {
        await loadAndDisplayBracketTree(tournamentObj);
      } else {
        clearBracketSection();
      }
      
    } catch (error) {
      console.error('Error loading tournament data:', error);
      showEmpty();
    }
  }
  
  async function loadAndDisplayBracketTree(tournament) {
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
        .eq('tournament_id', tournament.id)
        .order('round_number', { ascending: true })
        .order('match_number', { ascending: true });

      if (error) {
        console.error('Error loading bracket:', error);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No bracket generated yet for this tournament');
        clearBracketSection();
        return;
      }

      displayBracketTree(data, tournament);
    } catch (error) {
      console.error('Error loading bracket:', error);
      clearBracketSection();
    }
  }
  
  function clearBracketSection() {
    const bracketSection = document.getElementById('bracketTreeSection');
    if (bracketSection) {
      bracketSection.innerHTML = '';
    }
  }
  
  function displayBracketTree(matches, tournament) {
    const bracketSection = document.getElementById('bracketTreeSection');
    if (!bracketSection) return;

    // Group matches by round
    const rounds = {};
    matches.forEach(match => {
      if (!rounds[match.round_number]) {
        rounds[match.round_number] = [];
      }
      rounds[match.round_number].push(match);
    });

    const totalRounds = Object.keys(rounds).length;
    const maxRoundNum = Math.max(...Object.keys(rounds).map(Number));
    const roundNums = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));
    const slotCount = roundNums.length > 0 ? (rounds[roundNums[0]].length || 1) : 1;

    let html = `
      <h2 style="margin-bottom: 1.5rem; text-align: center;" data-i18n="bracket.bracketTitle">Bracket d'élimination</h2>
      <div class="bracket-container">
        <div class="bracket">
    `;

    roundNums.forEach((roundNum, roundIndex) => {
      const roundMatches = rounds[roundNum];
      const isLastRound = parseInt(roundNum) === maxRoundNum;
      const thirdPlaceMatch = isLastRound ? roundMatches.find(m => m.match_number === 2) : null;
      const finalMatch = isLastRound ? roundMatches.find(m => m.match_number === 1) : null;

      if (isLastRound && (thirdPlaceMatch || finalMatch)) {
        const half = Math.max(1, Math.floor(slotCount / 2));
        const finalSpan = Math.max(1, Math.floor(slotCount / 4));
        const thirdSpan = Math.max(1, Math.floor(slotCount / 4));
        const finalRowStart = Math.max(1, half - finalSpan);
        const thirdRowStart = half + 1;
        if (thirdPlaceMatch) {
          const gridStyle = `grid-row: ${thirdRowStart} / span ${thirdSpan};`;
          html += `
        <div class="bracket-round bracket-round-third">
          <div class="bracket-round-title bracket-round-title-third" data-i18n="bracket.thirdPlace">3rd Place</div>
          <div class="bracket-round-matches" style="display:grid;grid-template-rows:repeat(${slotCount},1fr);gap:1rem;flex:1;min-height:0;">
            ${renderBracketMatch(thirdPlaceMatch, true, false, gridStyle)}
          </div>
        </div>`;
        }
        if (finalMatch) {
          const gridStyle = `grid-row: ${finalRowStart} / span ${finalSpan};`;
          const roundKey = getBracketRoundNameKey(parseInt(roundNum), totalRounds, roundMatches);
          const roundName = getBracketRoundName(parseInt(roundNum), totalRounds, roundMatches);
          const roundTitleHtml = roundKey === 'bracket.round'
            ? escapeHtml(roundName)
            : `<span data-i18n="${roundKey}">${escapeHtml(roundName)}</span>`;
          html += `
        <div class="bracket-round bracket-round-final">
          <div class="bracket-round-title bracket-round-title-final">${roundTitleHtml}</div>
          <div class="bracket-round-matches" style="display:grid;grid-template-rows:repeat(${slotCount},1fr);gap:1rem;flex:1;min-height:0;">
            ${renderBracketMatch(finalMatch, false, true, gridStyle)}
          </div>
        </div>`;
        }
        return;
      }

      const roundKey = getBracketRoundNameKey(parseInt(roundNum), totalRounds, roundMatches);
      const roundName = getBracketRoundName(parseInt(roundNum), totalRounds, roundMatches);
      const roundTitleHtml = roundKey === 'bracket.round'
        ? escapeHtml(roundName)
        : `<span data-i18n="${roundKey}">${escapeHtml(roundName)}</span>`;

      const span = Math.max(1, Math.floor(slotCount / roundMatches.length));
      html += `
        <div class="bracket-round">
          <div class="bracket-round-title">${roundTitleHtml}</div>
          <div class="bracket-round-matches" style="display:grid;grid-template-rows:repeat(${slotCount},1fr);gap:1rem;flex:1;min-height:0;">
      `;

      roundMatches.forEach((match, matchIndex) => {
        const rowStart = matchIndex * span + 1;
        const gridStyle = `grid-row: ${rowStart} / span ${span};`;
        html += renderBracketMatch(match, false, false, gridStyle);
      });

      html += `</div></div>`;
    });

    html += `
        </div>
      </div>
    `;

    bracketSection.innerHTML = html;
    if (window.i18n && window.i18n.updateAllText) window.i18n.updateAllText();
  }

  function getBracketRoundNameKey(roundNum, totalRounds, roundMatches) {
    if (roundNum === 1 && roundMatches && roundMatches.some(m => !m.player1 || !m.player2)) return 'bracket.playIn';
    const remaining = totalRounds - roundNum + 1;
    if (remaining === 1) return 'bracket.finals';
    if (remaining === 2) return 'bracket.semifinals';
    if (remaining === 3) return 'bracket.quarterFinals';
    if (remaining === 4) return 'bracket.roundOf16';
    if (remaining === 5) return 'bracket.roundOf32';
    return 'bracket.round';
  }

  function getBracketRoundName(roundNum, totalRounds, roundMatches) {
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const key = getBracketRoundNameKey(roundNum, totalRounds, roundMatches);
    if (key !== 'bracket.round') return t(key);
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

  const ROW_AVATAR_STYLE = 'width:32px;height:32px;min-width:32px;min-height:32px;max-width:32px;max-height:32px;border-radius:50%;object-fit:cover;border:2px solid rgba(0,0,0,0.1);box-sizing:border-box;display:block;flex-shrink:0';
  const ROW_PLACEHOLDER_STYLE = 'width:32px;height:32px;min-width:32px;min-height:32px;border-radius:50%;border:2px solid rgba(0,0,0,0.1);box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;font-size:1rem;background:#e8ece9;flex-shrink:0';
  const ROW_CELL_STYLE = 'vertical-align:middle;padding:12px 16px;height:48px;max-height:48px;box-sizing:border-box;';
  const ROW_CELL_INNER_STYLE = 'display:flex;align-items:center;gap:8px;overflow:hidden;min-width:0;';
  const ROW_NAME_STYLE = 'font-size:1rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;min-width:0;';
  const AVATAR_PLACEHOLDER = `<div style="${ROW_PLACEHOLDER_STYLE}">🎮</div>`;

  function renderParticipantWithAvatar(display, fallback, i18nKey) {
    const hasName = display.name;
    const name = hasName ? display.name : (fallback || 'TBD');
    const avatar = display.avatarUrl
      ? `<img width="32" height="32" src="${escapeHtml(display.avatarUrl)}" alt="" loading="lazy" style="${ROW_AVATAR_STYLE}" />`
      : AVATAR_PLACEHOLDER;
    const nameHtml = hasName ? escapeHtml(name) : (i18nKey ? `<span data-i18n="${i18nKey}">${escapeHtml(name)}</span>` : escapeHtml(name));
    return `${avatar}<span style="${ROW_NAME_STYLE}">${nameHtml}</span>`;
  }

  function renderBracketMatch(match, isThirdPlace, isFinal, gridRowStyle) {
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const byeLabel = t('bracket.bye') || 'Bye';
    const tbdLabel = t('bracket.tbd') || 'TBD';
    const emptySlotLabel = (roundNum) => (roundNum === 1 ? byeLabel : tbdLabel);
    const p1 = getParticipantDisplay(match.player1);
    const p2 = getParticipantDisplay(match.player2);
    const winner = getParticipantDisplay(match.winner);
    const winnerName = winner.name;
    const r = match.round_number != null ? match.round_number : 1;
    const p1Fallback = match.player1 ? tbdLabel : emptySlotLabel(r);
    const p2Fallback = match.player2 ? tbdLabel : emptySlotLabel(r);
    const p1I18nKey = !match.player1 ? (r === 1 ? 'bracket.bye' : 'bracket.tbd') : (!p1.name ? 'bracket.tbd' : null);
    const p2I18nKey = !match.player2 ? (r === 1 ? 'bracket.bye' : 'bracket.tbd') : (!p2.name ? 'bracket.tbd' : null);
    const player1Name = p1.name || p1Fallback;
    const player2Name = p2.name || p2Fallback;

    const isCompleted = match.match_status === 'completed' || match.winner_id;
    const thirdClass = isThirdPlace ? ' bracket-match-third-place' : '';
    const finalClass = isFinal ? ' bracket-match-final' : '';
    let badge = '';
    if (isThirdPlace) badge = '<div class="bracket-match-badge bracket-match-badge-third" data-i18n="bracket.thirdPlace">3rd Place</div>';
    else if (isFinal) badge = '<div class="bracket-match-badge bracket-match-badge-final" data-i18n="bracket.finals">Finals</div>';

    const gridAttr = gridRowStyle ? ` style="${gridRowStyle}"` : '';
    return `
      <div class="bracket-match ${isCompleted ? 'completed' : ''}${thirdClass}${finalClass}"${gridAttr}>
        ${badge}
        <div class="bracket-player ${winnerName === player1Name ? 'winner' : winnerName ? 'loser' : ''}">
          ${match.player1_seed ? `<span class="player-seed">${match.player1_seed}</span>` : ''}
          <span class="bracket-player-inner">${renderParticipantWithAvatar(p1, p1Fallback, p1I18nKey)}</span>
        </div>
        <div class="bracket-player ${winnerName === player2Name ? 'winner' : winnerName ? 'loser' : ''}">
          ${match.player2_seed ? `<span class="player-seed">${match.player2_seed}</span>` : ''}
          <span class="bracket-player-inner">${renderParticipantWithAvatar(p2, p2Fallback, p2I18nKey)}</span>
        </div>
      </div>
    `;
  }
  
  function hideRoundFilter() {
    const filterContainer = document.getElementById('roundFilterContainer');
    const filterSelect = document.getElementById('roundFilter');
    if (!filterContainer || !filterSelect) return;
    currentRoundFilter = 'overall';
    const currentLang = window.i18n ? window.i18n.currentLang : 'fr';
    const overallText = translations[currentLang].bracket.overallStandings;
    filterSelect.innerHTML = `<option value="overall">${overallText}</option>`;
    filterContainer.classList.add('hidden');
  }

  function setupRoundFilter(matches) {
    // Rounds for this tournament only (dropdown is per-tournament)
    const rounds = [...new Set(matches.map(m => m.round_number))].sort((a, b) => a - b);
    const filterContainer = document.getElementById('roundFilterContainer');
    const filterSelect = document.getElementById('roundFilter');
    if (!filterSelect || !filterContainer) return;

    const currentLang = window.i18n ? window.i18n.currentLang : 'fr';
    const roundText = translations[currentLang].bracket.round;
    const overallText = translations[currentLang].bracket.overallStandings;

    filterSelect.innerHTML = `<option value="overall">${overallText}</option>`;
    rounds.forEach(round => {
      const option = document.createElement('option');
      option.value = round;
      option.textContent = `${roundText} ${round}`;
      filterSelect.appendChild(option);
    });
    filterSelect.value = 'overall';
    filterContainer.classList.remove('hidden');
  }

  function displayLeaderboard(participants, matches, roundFilter = 'overall') {
    hideLoading();
    
    // Update tournament info
    updateTournamentInfo(participants);
    
    // Filter matches by round if needed
    let filteredMatches = matches;
    if (roundFilter !== 'overall') {
      filteredMatches = matches.filter(m => m.round_number === parseInt(roundFilter));
    }
    
    // Calculate points per participant from scores object
    const participantScores = {};
    
    participants.forEach(p => {
      participantScores[p.id] = {
        id: p.id,
        username: (p.roblox_display_name || p.roblox_username || '').trim() || p.roblox_username,
        avatarUrl: p.roblox_avatar_url || null,
        totalPoints: 0,
        roundsPlayed: 0
      };
    });

    // Extract scores from matches
    filteredMatches.forEach(match => {
      if (match.scores) {
        Object.entries(match.scores).forEach(([username, scoreData]) => {
          const participant = participants.find(p => p.roblox_username === username);
          if (participant && participantScores[participant.id]) {
            participantScores[participant.id].totalPoints += scoreData.points || 0;
            participantScores[participant.id].roundsPlayed++;
          }
        });
      }
    });

    // Convert to array and sort by points
    const leaderboard = Object.values(participantScores)
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // Assign ranks (handling ties)
    let currentRank = 1;
    leaderboard.forEach((player, index) => {
      if (index > 0 && player.totalPoints === leaderboard[index - 1].totalPoints) {
        // Tie - same rank as previous
        player.rank = leaderboard[index - 1].rank;
      } else {
        player.rank = currentRank;
      }
      currentRank++;
    });

    // Mark ALL players in tied positions
    const rankCounts = {};
    leaderboard.forEach(player => {
      rankCounts[player.rank] = (rankCounts[player.rank] || 0) + 1;
    });
    
    leaderboard.forEach(player => {
      player.isTied = rankCounts[player.rank] > 1;
    });

    // Show participants section
    document.getElementById('participantsSection').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');

    // Update counts
    document.getElementById('participantCountDisplay').textContent = participants.length;
    document.getElementById('participantNumber').textContent = participants.length;

    // Generate leaderboard table
    const participantsList = document.getElementById('participantsList');
    participantsList.innerHTML = `
      <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
        <table class="table" style="margin: 0;">
          <thead>
            <tr>
              <th style="width: 100px; min-width: 100px; text-align: center;"><span data-i18n="bracket.rank">Rang</span></th>
              <th><span data-i18n="bracket.participant">Participant</span></th>
              <th style="width: 120px; text-align: center;"><span data-i18n="bracket.rounds">Rondes</span></th>
              <th style="width: 120px; text-align: center;"><span data-i18n="bracket.points">Points</span></th>
            </tr>
          </thead>
          <tbody>
            ${leaderboard.map((player, index) => {
              const medalEmoji = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : '';
              const rankNum = player.rank;
              const rankLabel = player.isTied ? `T${rankNum}` : String(rankNum);
              const tieSup = player.isTied ? '<sup class="rank-tie-sup" data-i18n="bracket.tie">TIE</sup>' : '';
              const rowBg = player.rank === 1 ? 'background: linear-gradient(to right, #FFD70022, transparent);' : player.rank === 2 ? 'background: linear-gradient(to right, #C0C0C022, transparent);' : player.rank === 3 ? 'background: linear-gradient(to right, #CD7F3222, transparent);' : 'background: #fafafa;';
              const rankColor = player.rank === 1 ? '#b8860b' : player.rank === 2 ? '#6c757d' : player.rank === 3 ? '#cd7f32' : '#333';
              return `
                <tr style="${rowBg} height: 48px;">
                  <td class="leaderboard-rank-td" style="text-align: center; vertical-align: middle; padding: 12px 16px; height: 48px; max-height: 48px; color: ${rankColor}; font-weight: 700; font-size: 1.125rem; box-sizing: border-box;">
                    <span class="leaderboard-rank-inner">${medalEmoji} ${rankLabel}${tieSup}</span>
                  </td>
                  <td style="${ROW_CELL_STYLE}"><div class="participant-cell-inner" style="${ROW_CELL_INNER_STYLE}">
                    ${player.avatarUrl ? `<img width="32" height="32" src="${escapeHtml(player.avatarUrl)}" alt="" loading="lazy" style="${ROW_AVATAR_STYLE}" />` : AVATAR_PLACEHOLDER}
                    <span style="${ROW_NAME_STYLE}">${escapeHtml(player.username)}</span>
                  </div></td>
                  <td style="text-align: center; vertical-align: middle; padding: 12px 16px; height: 48px; max-height: 48px; color: #666; box-sizing: border-box;">
                    ${player.roundsPlayed}
                  </td>
                  <td style="text-align: center; vertical-align: middle; padding: 12px 16px; height: 48px; max-height: 48px; font-weight: 700; font-size: 1.25rem; color: #6ab04c; box-sizing: border-box;">
                    ${player.totalPoints}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    // Apply translations
    if (typeof updateAllText === 'function') {
      updateAllText();
    }
  }

  function displayParticipants(participants) {
    hideLoading();
    
    // Update tournament info
    updateTournamentInfo(participants);
    
    // Show participants section
    document.getElementById('participantsSection').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    
    // Generate participant cards
    const participantsList = document.getElementById('participantsList');
    participantsList.innerHTML = '';
    
    participants.forEach((participant, index) => {
      const card = createParticipantCard(participant, index + 1);
      participantsList.appendChild(card);
    });
    
    // Update counts
    document.getElementById('participantCountDisplay').textContent = participants.length;
    document.getElementById('participantNumber').textContent = participants.length;
  }
  
  function createParticipantCard(participant, number) {
    const displayName = (participant.roblox_display_name || participant.roblox_username || '').trim() || participant.roblox_username;
    const avatarHtml = participant.roblox_avatar_url
      ? `<img width="80" height="80" src="${escapeHtml(participant.roblox_avatar_url)}" alt="" class="participant-avatar participant-avatar-img" loading="lazy" style="border-radius:50%;object-fit:cover;display:block;" />`
      : '<div class="participant-avatar participant-avatar-placeholder">🎮</div>';
    const card = document.createElement('div');
    card.className = 'participant-card';
    card.innerHTML = `
      ${avatarHtml}
      <div class="participant-name">${escapeHtml(displayName)}</div>
      <div class="participant-status">
        #${number}
      </div>
    `;
    return card;
  }
  
  function updateTournamentInfo(participants) {
    const tournament = tournaments.find(t => t.tournament_type === currentTournament);
    const tournamentNameEl = document.getElementById('tournamentName');
    const participantCountEl = document.getElementById('participantNumber');
    const statusBadgeEl = document.getElementById('tournamentStatusBadge');
    
    if (tournamentNameEl) {
      if (tournament) {
        const currentLang = window.i18n ? window.i18n.currentLang : 'fr';
        tournamentNameEl.textContent = currentLang === 'fr' ? (tournament.name_fr || tournament.name_en) : (tournament.name_en || tournament.name_fr);
      } else {
        tournamentNameEl.textContent = currentTournament || '—';
      }
    }
    
    if (participantCountEl) {
      participantCountEl.textContent = participants ? participants.length : 0;
    }
    
    if (statusBadgeEl && tournament && window.i18n && window.i18n.t) {
      const status = tournament.status || 'published';
      const key = status === 'completed' ? 'bracket.statusCompleted'
        : status === 'in-progress' ? 'bracket.statusInProgress'
        : 'bracket.statusRegistration';
      statusBadgeEl.textContent = window.i18n.t(key);
    }
  }

  // ============================================
  // REAL-TIME UPDATES
  // ============================================
  
  function setupRealtimeUpdates() {
    const supabase = window.supabaseConfig.supabase;
    const TABLES = window.supabaseConfig.TABLES;
    
    // Unsubscribe from previous channel if exists
    if (realtimeSubscription) {
      realtimeSubscription.unsubscribe();
    }
    
    // Subscribe to participants table changes
    realtimeSubscription = supabase
      .channel('participants-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: TABLES.PARTICIPANTS
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          
          // Reload tournament data
          loadTournamentData(currentTournament);
          
          // Update timestamp
          updateTimestamp();
        }
      )
      .subscribe();
    
    console.log('✅ Real-time updates enabled');
  }

  // ============================================
  // UI HELPERS
  // ============================================
  
  function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('participantsSection').classList.add('hidden');
  }
  
  function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
  }
  
  function showEmpty() {
    hideLoading();
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('participantsSection').classList.add('hidden');
    document.getElementById('participantNumber').textContent = '0';
  }
  
  function updateTimestamp() {
    const now = new Date();
    const timeString = now.toLocaleTimeString(window.i18n.currentLang === 'fr' ? 'fr-CA' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    document.getElementById('updateTime').textContent = timeString;
  }
  
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ============================================
  // DEMO DATA (for testing without Supabase)
  // ============================================
  
  function loadDemoData() {
    const demoParticipants = [
      {
        id: '1',
        roblox_username: 'ProGamer123',
        tournament_type: currentTournament,
        signup_timestamp: new Date()
      },
      {
        id: '2',
        roblox_username: 'NinjaWarrior',
        tournament_type: currentTournament,
        signup_timestamp: new Date()
      },
      {
        id: '3',
        roblox_username: 'SpeedRunner42',
        tournament_type: currentTournament,
        signup_timestamp: new Date()
      },
      {
        id: '4',
        roblox_username: 'CoolPlayer99',
        tournament_type: currentTournament,
        signup_timestamp: new Date()
      },
      {
        id: '5',
        roblox_username: 'EpicGamer777',
        tournament_type: currentTournament,
        signup_timestamp: new Date()
      }
    ];
    
    displayParticipants(demoParticipants);
  }

  // ============================================
  // CLEANUP
  // ============================================
  
  // Unsubscribe when leaving page
  window.addEventListener('beforeunload', function() {
    if (realtimeSubscription) {
      realtimeSubscription.unsubscribe();
    }
  });

})();
