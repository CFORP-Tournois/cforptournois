// Bracket Display Logic for Le Centre Franco Tournaments
// Handles real-time bracket updates and leaderboard display

(function() {
  'use strict';

  let currentTournament = null; // Will be set to first tournament
  let realtimeSubscription = null;
  let tournaments = [];

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', initBracketPage);

  async function initBracketPage() {
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
  
  function updateTournamentInfo(tournamentType) {
    const tournament = tournaments.find(t => t.tournament_type === tournamentType);
    if (!tournament) return;
    
    const currentLang = window.i18n ? window.i18n.currentLang : 'fr';
    const name = currentLang === 'fr' ? tournament.name_fr : tournament.name_en;
    
    const nameEl = document.getElementById('tournamentName');
    if (nameEl) {
      nameEl.textContent = name;
    }
  }
  
  // Listen for language changes
  window.addEventListener('languageChanged', () => {
    if (tournaments.length > 0) {
      renderTournamentTabs();
      if (currentTournament) {
        // Re-select current tournament
        const activeTab = document.querySelector(`[data-tournament="${currentTournament}"]`);
        if (activeTab) {
          activeTab.classList.add('active');
        }
        updateTournamentInfo(currentTournament);
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
      
      // Fetch participants for this tournament
      console.log('👥 Fetching participants for tournament_type:', tournament);
      const { data: participants, error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .select('*')
        .eq('tournament_type', tournament)
        .order('signup_timestamp', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching participants:', error);
        showEmpty();
        return;
      }
      
      console.log('✅ Found participants:', participants ? participants.length : 0, participants);
      
      if (!participants || participants.length === 0) {
        console.warn('⚠️ No participants found for tournament_type:', tournament);
        showEmpty();
        return;
      }
      
      // Get tournament object
      const tournamentObj = tournaments.find(t => t.tournament_type === tournament);
      if (!tournamentObj) {
        displayParticipants(participants);
        return;
      }

      // Fetch match results for leaderboard
      console.log('🔍 Fetching matches for tournament:', tournament);
      const { data: matches, error: matchError } = await supabase
        .from(TABLES.MATCHES)
        .select('*')
        .eq('tournament_type', tournament);

      if (matchError) {
        console.error('❌ Error fetching matches:', matchError);
      }

      console.log('📊 Found matches:', matches ? matches.length : 0);

      // Calculate leaderboard if we have results
      if (matches && matches.length > 0) {
        console.log('✅ Displaying leaderboard with', matches.length, 'matches');
        displayLeaderboard(participants, matches);
      } else {
        // No results yet, show participant list
        console.log('ℹ️ No matches found - showing participant list');
        displayParticipants(participants);
      }
      
      // Check if tournament has bracket style and load bracket
      if (tournamentObj && (tournamentObj.bracket_style === 'head-to-head' || tournamentObj.bracket_style === 'mixed')) {
        await loadAndDisplayBracketTree(tournamentObj);
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
          player1:participants!bracket_matches_player1_id_fkey(roblox_username),
          player2:participants!bracket_matches_player2_id_fkey(roblox_username),
          winner:participants!bracket_matches_winner_id_fkey(roblox_username)
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
        return;
      }

      displayBracketTree(data, tournament);
    } catch (error) {
      console.error('Error loading bracket:', error);
    }
  }
  
  function displayBracketTree(matches, tournament) {
    // Check if bracket container exists in bracket section
    let bracketSection = document.getElementById('bracketTreeSection');
    
    if (!bracketSection) {
      // Create bracket section
      const participantsSection = document.getElementById('participantsSection');
      bracketSection = document.createElement('div');
      bracketSection.id = 'bracketTreeSection';
      bracketSection.style.marginTop = '3rem';
      participantsSection.parentNode.insertBefore(bracketSection, participantsSection.nextSibling);
    }

    // Group matches by round
    const rounds = {};
    matches.forEach(match => {
      if (!rounds[match.round_number]) {
        rounds[match.round_number] = [];
      }
      rounds[match.round_number].push(match);
    });

    const totalRounds = Object.keys(rounds).length;

    let html = `
      <h2 style="margin-bottom: 1.5rem; text-align: center;" data-i18n="bracket.bracketTitle">Bracket d'élimination</h2>
      <div class="bracket-container">
        <div class="bracket">
    `;

    Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b)).forEach(roundNum => {
      const roundMatches = rounds[roundNum];
      const roundName = getBracketRoundName(parseInt(roundNum), totalRounds);

      html += `
        <div class="bracket-round">
          <div class="bracket-round-title">${roundName}</div>
      `;

      roundMatches.forEach(match => {
        html += renderBracketMatch(match);
      });

      html += `</div>`;
    });

    html += `
        </div>
      </div>
    `;

    bracketSection.innerHTML = html;
  }

  function getBracketRoundName(roundNum, totalRounds) {
    const remaining = totalRounds - roundNum + 1;
    
    if (remaining === 1) return 'Finale / Finals';
    if (remaining === 2) return 'Demi-finales / Semi-Finals';
    if (remaining === 3) return 'Quarts de finale / Quarter-Finals';
    if (remaining === 4) return 'Huitièmes / Round of 16';
    
    return `Round ${roundNum}`;
  }

  function renderBracketMatch(match) {
    const player1Name = match.player1?.[0]?.roblox_username || 'TBD';
    const player2Name = match.player2?.[0]?.roblox_username || 'TBD';
    const winnerName = match.winner?.[0]?.roblox_username;

    const isCompleted = match.match_status === 'completed' || match.winner_id;

    return `
      <div class="bracket-match ${isCompleted ? 'completed' : ''}">
        <div class="bracket-player ${winnerName === player1Name ? 'winner' : winnerName ? 'loser' : ''}">
          ${match.player1_seed ? `<span class="player-seed">${match.player1_seed}</span>` : ''}
          <span class="player-name">${player1Name}</span>
        </div>
        <div class="bracket-player ${winnerName === player2Name ? 'winner' : winnerName ? 'loser' : ''}">
          ${match.player2_seed ? `<span class="player-seed">${match.player2_seed}</span>` : ''}
          <span class="player-name">${player2Name}</span>
        </div>
      </div>
    `;
  }
  
  function displayLeaderboard(participants, matches) {
    hideLoading();
    
    // Update tournament info
    updateTournamentInfo(participants);
    
    // Calculate total points per participant
    const participantScores = {};
    
    participants.forEach(p => {
      participantScores[p.id] = {
        id: p.id,
        username: p.roblox_username,
        totalPoints: 0,
        roundsPlayed: 0
      };
    });

    matches.forEach(match => {
      if (participantScores[match.participant_id]) {
        participantScores[match.participant_id].totalPoints += match.points || 0;
        participantScores[match.participant_id].roundsPlayed++;
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
        player.isTied = true;
      } else {
        player.rank = currentRank;
        player.isTied = false;
      }
      currentRank++;
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
              <th style="width: 80px; text-align: center;"><span data-i18n="bracket.rank">Rang</span></th>
              <th><span data-i18n="bracket.participant">Participant</span></th>
              <th style="width: 120px; text-align: center;"><span data-i18n="bracket.rounds">Rondes</span></th>
              <th style="width: 120px; text-align: center;"><span data-i18n="bracket.points">Points</span></th>
            </tr>
          </thead>
          <tbody>
            ${leaderboard.map((player, index) => {
              const rankDisplay = player.isTied && index > 0 && player.rank === leaderboard[index - 1].rank
                ? `T${player.rank}`
                : player.rank;
              
              const medalEmoji = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : '';
              
              return `
                <tr style="${player.rank <= 3 ? 'background: linear-gradient(to right, ' + (player.rank === 1 ? '#FFD70020' : player.rank === 2 ? '#C0C0C020' : '#CD7F3220') + ', transparent);' : ''}">
                  <td style="text-align: center; font-weight: 700; font-size: 1.25rem; color: ${player.rank === 1 ? '#FFD700' : player.rank === 2 ? '#C0C0C0' : player.rank === 3 ? '#CD7F32' : '#666'};">
                    ${medalEmoji} ${rankDisplay}${player.isTied ? '<sup style="font-size: 0.6rem; margin-left: 2px;" data-i18n="bracket.tie">TIE</sup>' : ''}
                  </td>
                  <td style="font-weight: 600; font-size: 1.125rem;">
                    ${escapeHtml(player.username)}
                  </td>
                  <td style="text-align: center; color: #666;">
                    ${player.roundsPlayed}
                  </td>
                  <td style="text-align: center; font-weight: 700; font-size: 1.25rem; color: #8DC63F;">
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
    if (window.i18n) {
      window.i18n.applyTranslations();
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
    const card = document.createElement('div');
    card.className = 'participant-card';
    card.innerHTML = `
      <div class="participant-avatar">
        🎮
      </div>
      <div class="participant-name">${escapeHtml(participant.roblox_username)}</div>
      <div class="participant-status">
        #${number}
      </div>
    `;
    return card;
  }
  
  function updateTournamentInfo(participants) {
    const tournamentName = document.getElementById('tournamentName');
    const participantCount = document.getElementById('participantNumber');
    
    // Set tournament name based on current tournament
    if (currentTournament === 'pvp') {
      tournamentName.textContent = 'RIVALS (13-18)';
    } else {
      tournamentName.textContent = window.i18n.t('landing.tournament2Title');
    }
    
    participantCount.textContent = participants.length;
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
