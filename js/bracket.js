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
      
      if (tournaments.length > 0) {
        renderTournamentTabs();
        // Set first tournament as current
        currentTournament = tournaments[0].tournament_type;
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
      const { data: participants, error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .select('*')
        .eq('tournament_type', tournament)
        .order('signup_timestamp', { ascending: true });
      
      if (error) {
        console.error('Error fetching participants:', error);
        showEmpty();
        return;
      }
      
      if (!participants || participants.length === 0) {
        showEmpty();
        return;
      }
      
      // Display participants
      displayParticipants(participants);
      
      // TODO: Fetch and display matches/leaderboard when available
      
    } catch (error) {
      console.error('Error loading tournament data:', error);
      showEmpty();
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
