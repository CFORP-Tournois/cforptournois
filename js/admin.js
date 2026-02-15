// Admin Panel Logic for AFNOO Tournaments
// ENGLISH ONLY - Admin interface

(function() {
  'use strict';

  // ADMIN PASSWORD - Keep this secure!
  // ⚠️ This is visible in public GitHub - change regularly
  const ADMIN_PASSWORD = 'AFNOO2026!Secure'; // TODO: Change and use proper auth in production
  
  // Top 10 get points 100 down to 10; below top 10 get 0
  const POINT_SCALE = {
    1: 100,
    2: 90,
    3: 80,
    4: 70,
    5: 60,
    6: 50,
    7: 40,
    8: 30,
    9: 20,
    10: 10
  };

  let isAuthenticated = false;
  let currentParticipants = [];
  let adminTournaments = []; // Store tournaments for admin operations
  let existingResultsMatches = []; // Store matches for "Existing Results" so round filter doesn't reload and reset
  let existingResultsParticipants = []; // All participants for selected tournament (for Edit Existing - show all when round selected)

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Set up login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if already logged in via sessionStorage
    const savedAuth = sessionStorage.getItem('adminAuth');
    if (savedAuth === 'true') {
      isAuthenticated = true;
      showAdminInterface();
    }
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  
  function handleLogin(event) {
    event.preventDefault();
    
    const password = document.getElementById('adminPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    // Simple password check (use proper authentication in production!)
    if (password === ADMIN_PASSWORD) {
      isAuthenticated = true;
      sessionStorage.setItem('adminAuth', 'true');
      showAdminInterface();
      errorDiv.classList.add('hidden');
    } else {
      errorDiv.textContent = '⚠️ Incorrect password';
      errorDiv.classList.remove('hidden');
    }
  }
  
  function showAdminInterface() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('adminInterface').classList.remove('hidden');
    
    // Initialize admin interface
    initAdmin();
  }
  
  function logout() {
    isAuthenticated = false;
    sessionStorage.removeItem('adminAuth');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('adminInterface').classList.add('hidden');
    document.getElementById('adminPassword').value = '';
  }

  // ============================================
  // ADMIN INTERFACE INITIALIZATION
  // ============================================
  
  async function initAdmin() {
    // Load tournaments first for dropdown filters
    await loadAdminTournaments();
    
    // Set up tabs
    setupAdminTabs();
    
    // Set up logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Load participants
    loadParticipants();
    
    // Set up results entry
    setupResultsEntry();
    
    // Set up export functionality
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    
    // Set up tournament management
    setupTournamentManagement();
    
    // Set up bracket management
    if (window.initBracketManagement) {
      window.initBracketManagement();
    }
  }
  
  async function loadAdminTournaments() {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      console.warn('Supabase not configured');
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
      
      adminTournaments = data || [];
      console.log('📋 Loaded', adminTournaments.length, 'tournaments for admin');
      populateAdminTournamentFilters();
      
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  function populateAdminTournamentFilters() {
    // Update participants filter dropdown
    const filterTournament = document.getElementById('filterTournament');
    if (filterTournament) {
      filterTournament.innerHTML = '<option value="all">All Tournaments</option>';
      adminTournaments.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id; // Use ID now
        option.textContent = t.name_en;
        filterTournament.appendChild(option);
      });
    }
    
    // Update results tournament dropdown
    const resultsTournament = document.getElementById('resultsTournament');
    if (resultsTournament) {
      resultsTournament.innerHTML = '<option value="">-- Choose Tournament --</option>';
      adminTournaments.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id; // Use ID now
        option.textContent = t.name_en;
        resultsTournament.appendChild(option);
      });
    }
  }
  
  function setupAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        switchAdminTab(tabName);
      });
    });
  }
  
  function switchAdminTab(tabName) {
    // Update active tab
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Show corresponding content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
  }

  // ============================================
  // PARTICIPANTS MANAGEMENT
  // ============================================
  
  async function loadParticipants() {
    const filterTournament = document.getElementById('filterTournament').value;
    
    try {
      if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
        // Demo mode
        loadDemoParticipants();
        return;
      }
      
      const supabase = window.supabaseConfig.supabase;
      const TABLES = window.supabaseConfig.TABLES;
      
      // Join with tournaments to get tournament names
      let query = supabase
        .from(TABLES.PARTICIPANTS)
        .select(`
          *,
          tournament:tournaments!inner(id, name_en, name_fr, tournament_type)
        `)
        .order('signup_timestamp', { ascending: false });
      
      // Apply filter using tournament_id
      if (filterTournament !== 'all') {
        query = query.eq('tournament_id', filterTournament);
      }
      
      const { data: participants, error } = await query;
      
      if (error) {
        console.error('Error loading participants:', error);
        return;
      }
      
      currentParticipants = participants || [];
      displayParticipantsTable(currentParticipants);
      
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  function displayParticipantsTable(participants) {
    const tbody = document.getElementById('participantsTableBody');
    
    if (participants.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
            No participants yet. Waiting for signups...
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = participants.map((p, index) => {
      // Get tournament name from joined data or fallback
      const tournament = p.tournament;
      const tournamentName = tournament 
        ? (tournament.name_en || tournament.name_fr || 'Unknown Tournament')
        : (adminTournaments.find(t => t.id === p.tournament_id)?.name_en || p.tournament_type || 'Unknown');
      
      return `
      <tr>
        <td>${index + 1}</td>
        <td class="participant-cell" style="font-weight: 600; color: #28724f;">${p.roblox_avatar_url ? `<img src="${escapeHtml(p.roblox_avatar_url)}" alt="" class="participant-avatar" loading="lazy" />` : '<div class="participant-avatar participant-avatar-placeholder">🎮</div>'}<span class="player-name">${escapeHtml((p.roblox_display_name || p.roblox_username || '').trim() || p.roblox_username)}</span></td>
        <td>${escapeHtml(tournamentName)}</td>
        <td>${formatDate(p.signup_timestamp)}</td>
        <td>
          <button class="btn btn-accent" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="deleteParticipant('${p.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `;
    }).join('');
  }
  
  function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('fr-CA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  // Make functions global for onclick handlers
  window.deleteParticipant = async function(participantId) {
    if (!confirm('Are you sure you want to delete this participant?')) {
      return;
    }
    
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      return;
    }
    
    const supabase = window.supabaseConfig.supabase;
    const TABLES = window.supabaseConfig.TABLES;
    
    const { error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .delete()
      .eq('id', participantId);
    
    if (error) {
      console.error('Error deleting participant:', error);
      alert('Error deleting participant');
    } else {
      loadParticipants(); // Reload table
    }
  };

  // ============================================
  // RESULTS ENTRY
  // ============================================
  
  function setupResultsEntry() {
    const newPanel = document.getElementById('resultsNewPanel');
    const existingPanel = document.getElementById('existingResultsContainer');
    const btnNew = document.getElementById('btnEnterNewResults');
    const btnExisting = document.getElementById('btnEditExistingResults');

    btnNew.addEventListener('click', () => {
      if (newPanel) newPanel.classList.remove('hidden');
      if (existingPanel) existingPanel.classList.add('hidden');
      btnNew.classList.add('active');
      if (btnExisting) btnExisting.classList.remove('active');
    });
    btnExisting.addEventListener('click', () => {
      if (newPanel) newPanel.classList.add('hidden');
      if (existingPanel) existingPanel.classList.remove('hidden');
      if (btnNew) btnNew.classList.remove('active');
      if (btnExisting) btnExisting.classList.add('active');
      loadExistingResults(); // load so they see existing results (uses selected tournament)
    });
    // Default: show Enter New Results
    if (existingPanel) existingPanel.classList.add('hidden');
    if (btnNew) btnNew.classList.add('active');

    document.getElementById('loadResultsBtn').addEventListener('click', async () => {
      await loadResultsForm();
      await loadExistingResults();
    });
    document.getElementById('filterTournament').addEventListener('change', loadParticipants);
    
    // Existing results management
    document.getElementById('resultsTournament').addEventListener('change', loadExistingResults);
    document.getElementById('refreshExistingBtn').addEventListener('click', loadExistingResults);
    document.getElementById('filterRound').addEventListener('change', () => {
      // Re-display only; do not reload (reload rebuilds dropdown and resets to "All")
      if (existingResultsMatches.length > 0) {
        displayExistingResults(existingResultsMatches);
      }
    });
    const existingContent = document.getElementById('existingResultsContent');
    if (existingContent) existingContent.addEventListener('click', handleExistingResultAction);
  }
  
  async function loadResultsForm() {
    const tournament = document.getElementById('resultsTournament').value;
    const round = document.getElementById('resultsRound').value;
    
    if (!tournament) {
      alert('Please select a tournament first');
      return;
    }
    
    try {
      if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
        // Demo mode
        loadDemoResultsForm();
        return;
      }
      
      const supabase = window.supabaseConfig.supabase;
      const TABLES = window.supabaseConfig.TABLES;
      
      // Block loading if this round already has results (avoid double-entry / wrong round)
      const roundNum = parseInt(round, 10);
      if (!isNaN(roundNum)) {
        const { data: existingForRound, error: checkErr } = await supabase
          .from(TABLES.MATCHES)
          .select('id')
          .eq('tournament_id', tournament)
          .eq('round_number', roundNum)
          .limit(1);
        if (!checkErr && existingForRound && existingForRound.length > 0) {
          alert(`Round ${round} already has results.\n\nUse the "Existing Results" section below to view or edit, or select a different round to enter new results.`);
          return;
        }
      }
      
      const { data: participants, error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .select('*')
        .eq('tournament_id', tournament)
        .order('roblox_username', { ascending: true });
      
      if (error) {
        console.error('Error loading participants:', error);
        return;
      }
      
      if (!participants || participants.length === 0) {
        alert('No participants registered for this tournament yet!');
        return;
      }
      
      displayResultsForm(participants, round);
      
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  function displayResultsForm(participants, round) {
    document.getElementById('resultsEntryContainer').classList.remove('hidden');
    document.getElementById('displayRound').textContent = round;
    document.getElementById('resultsSaved').classList.add('hidden');
    const searchInput = document.getElementById('resultsSearch');
    if (searchInput) searchInput.value = '';

    const tbody = document.getElementById('resultsTableBody');
    const displayName = (p) => (p.roblox_display_name || p.roblox_username || '').trim() || p.roblox_username;
    tbody.innerHTML = participants.map((p, index) => {
      const searchable = ((displayName(p) + ' ' + (p.roblox_username || '')).trim()).toLowerCase();
      return `
      <tr data-search="${escapeHtml(searchable)}">
        <td>${index + 1}</td>
        <td class="participant-cell" style="font-weight: 600;">${p.roblox_avatar_url ? `<img src="${escapeHtml(p.roblox_avatar_url)}" alt="" class="participant-avatar" loading="lazy" />` : '<div class="participant-avatar participant-avatar-placeholder">🎮</div>'}<span class="player-name">${escapeHtml(displayName(p))}</span></td>
        <td>
          <input 
            type="number" 
            class="placement-input" 
            data-participant-id="${p.id}"
            data-participant-username="${escapeHtml(p.roblox_username)}"
            placeholder="1"
            min="1"
            max="${participants.length}"
          >
        </td>
        <td>
          <span class="points-display" data-points-for="${p.id}">-</span>
        </td>
      </tr>
    `;
    }).join('');

    // Dynamic search: any space-separated tokens must all appear in the participant name (e.g. "BLA Run 22" matches BlaseRunner22)
    if (searchInput) {
      searchInput.oninput = function () {
        const tokens = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        tbody.querySelectorAll('tr').forEach(tr => {
          const text = (tr.dataset.search || '');
          const show = tokens.length === 0 || tokens.every(t => text.includes(t));
          tr.style.display = show ? '' : 'none';
        });
      };
    }

    // Add event listeners for placement inputs
    document.querySelectorAll('.placement-input').forEach(input => {
      input.addEventListener('input', updatePointsPreview);
    });
    
    // Set up save button
    document.getElementById('saveResultsBtn').onclick = saveResults;
    document.getElementById('clearResultsBtn').onclick = () => {
      document.querySelectorAll('.placement-input').forEach(input => {
        input.value = '';
        input.removeAttribute('data-placement');
      });
      updateAllPointsPreviews();
    };
  }
  
  function updatePointsPreview(event) {
    const input = event.target;
    const placement = parseInt(input.value);
    
    if (placement && placement > 0) {
      input.setAttribute('data-placement', placement);
      const points = calculatePoints(placement);
      const pointsDisplay = document.querySelector(`[data-points-for="${input.dataset.participantId}"]`);
      if (pointsDisplay) {
        pointsDisplay.textContent = points;
      }
    } else {
      input.removeAttribute('data-placement');
      const pointsDisplay = document.querySelector(`[data-points-for="${input.dataset.participantId}"]`);
      if (pointsDisplay) {
        pointsDisplay.textContent = '-';
      }
    }
  }
  
  function updateAllPointsPreviews() {
    document.querySelectorAll('.placement-input').forEach(input => {
      updatePointsPreview({ target: input });
    });
  }
  
  function calculatePoints(placement) {
    if (!placement || placement < 1) return 0;
    return POINT_SCALE[placement] ?? 0; // top 10 only; 11th and below = 0
  }
  
  async function saveResults() {
    const round = document.getElementById('resultsRound').value;
    const tournament = document.getElementById('resultsTournament').value;
    
    // Collect all placements
    const results = [];
    document.querySelectorAll('.placement-input').forEach(input => {
      const placement = parseInt(input.value);
      if (placement && placement > 0) {
        results.push({
          participantId: input.dataset.participantId,
          username: input.dataset.participantUsername,
          placement: placement,
          points: calculatePoints(placement)
        });
      }
    });
    
    if (results.length === 0) {
      alert('Please enter at least one placement!');
      return;
    }
    
    // Validate no duplicate placements
    const placements = results.map(r => r.placement);
    const uniquePlacements = new Set(placements);
    if (placements.length !== uniquePlacements.size) {
      alert('⚠️ Error: You have duplicate placements! Each participant must have a unique placement number.');
      return;
    }
    
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      console.log('DEMO MODE - Results:', results);
      document.getElementById('resultsSaved').classList.remove('hidden');
      setTimeout(() => {
        document.getElementById('resultsSaved').classList.add('hidden');
      }, 5000);
      return;
    }
    
    // Save to database
    try {
      const supabase = window.supabaseConfig.supabase;
      const TABLES = window.supabaseConfig.TABLES;
      
      // Create match record using tournament_id
      const { data: match, error: matchError } = await supabase
        .from(TABLES.MATCHES)
        .insert({
          tournament_id: tournament,
          tournament_type: 'legacy', // Keep for backwards compatibility
          round_number: parseInt(round),
          match_number: 1, // For FFA, all participants in one match
          participant_ids: results.map(r => r.participantId),
          scores: results.reduce((acc, r) => {
            acc[r.username] = {
              placement: r.placement,
              points: r.points
            };
            return acc;
          }, {}),
          completed: true,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (matchError) {
        throw matchError;
      }
      
      // Show success message
      document.getElementById('resultsSaved').classList.remove('hidden');
      
      // Hide after 5 seconds
      setTimeout(() => {
        document.getElementById('resultsSaved').classList.add('hidden');
      }, 5000);
      
      console.log('✅ Results saved successfully:', match);
      
      // Reload existing results after saving
      await loadExistingResults();
      
    } catch (error) {
      console.error('Error saving results:', error);
      alert('Error saving results: ' + error.message);
    }
  }

  // ============================================
  // VIEW/EDIT/DELETE EXISTING RESULTS
  // ============================================
  
  async function loadExistingResults() {
    const tournamentSelect = document.getElementById('resultsTournament');
    const tournament = tournamentSelect ? tournamentSelect.value : '';
    const noTournamentEl = document.getElementById('existingResultsNoTournament');
    const contentEl = document.getElementById('existingResultsContent');
    const tournamentNameEl = document.getElementById('existingResultsTournamentName');
    const noResultsEl = document.getElementById('noExistingResults');
    const tableBody = document.getElementById('existingResultsBody');

    console.log('🔍 Loading existing results for tournament:', tournament);

    if (!tournament) {
      existingResultsMatches = [];
      if (noTournamentEl) noTournamentEl.classList.remove('hidden');
      if (contentEl) contentEl.classList.add('hidden');
      return;
    }

    // Show content area and set tournament name (from selected option or admin list)
    if (noTournamentEl) noTournamentEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');
    const tournamentName = tournamentSelect.selectedOptions[0] ? tournamentSelect.selectedOptions[0].textContent : (adminTournaments.find(t => t.id === tournament)?.name_en || tournament);
    if (tournamentNameEl) tournamentNameEl.textContent = tournamentName;

    try {
      if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
        if (noResultsEl) noResultsEl.classList.remove('hidden');
        if (tableBody) tableBody.innerHTML = '';
        return;
      }

      const supabase = window.supabaseConfig.supabase;
      const TABLES = window.supabaseConfig.TABLES;

      const [matchesRes, participantsRes] = await Promise.all([
        supabase.from(TABLES.MATCHES).select('*').eq('tournament_id', tournament).order('round_number', { ascending: true }),
        supabase.from(TABLES.PARTICIPANTS).select('*').eq('tournament_id', tournament).order('roblox_username', { ascending: true })
      ]);

      const { data: matches, error } = matchesRes;
      const { data: participants, error: participantsErr } = participantsRes;

      if (error) {
        console.error('❌ Error loading existing results:', error);
        alert('Error loading results: ' + error.message);
        return;
      }
      existingResultsParticipants = participants || [];
      if (participantsErr) console.warn('Could not load participants for edit view:', participantsErr);

      console.log('📊 Found matches:', matches ? matches.length : 0, 'participants:', existingResultsParticipants.length);

      if (!matches || matches.length === 0) {
        existingResultsMatches = [];
        if (noResultsEl) noResultsEl.classList.remove('hidden');
        if (tableBody) tableBody.innerHTML = '';
        const filterRound = document.getElementById('filterRound');
        if (filterRound) filterRound.innerHTML = '<option value="">Select round</option>';
        return;
      }

      if (noResultsEl) noResultsEl.classList.add('hidden');
      existingResultsMatches = matches;

      const rounds = [...new Set(matches.map(m => m.round_number))].sort((a, b) => a - b);
      const filterRound = document.getElementById('filterRound');
      const currentFilter = filterRound.value;
      filterRound.innerHTML = '<option value="">Select round</option>' +
        rounds.map(r => `<option value="${r}">Round ${r}</option>`).join('');
      if (rounds.includes(Number(currentFilter))) {
        filterRound.value = currentFilter;
      } else {
        filterRound.value = '';
      }

      displayExistingResults(matches);
    } catch (error) {
      console.error('Error loading existing results:', error);
    }
  }
  
  function displayExistingResults(matches) {
    const filterRound = document.getElementById('filterRound').value;
    const tbody = document.getElementById('existingResultsBody');
    const searchInput = document.getElementById('existingResultsSearch');
    if (searchInput) searchInput.value = '';
    tbody.innerHTML = '';

    const displayName = (p) => (p.roblox_display_name || p.roblox_username || '').trim() || p.roblox_username;

    const roundNum = filterRound !== '' ? parseInt(filterRound, 10) : NaN;
    if (!isNaN(roundNum) && existingResultsParticipants.length > 0) {
      // Round selected: show ALL participants; those with a result get placement/Update/Delete, others get Add
      const match = matches.find(m => m.round_number === roundNum);
      const resultByUsername = {};
      if (match && match.scores) {
        Object.entries(match.scores).forEach(([username, scoreData]) => {
          resultByUsername[username] = { placement: scoreData.placement, points: scoreData.points, matchId: match.id };
        });
      }
      existingResultsParticipants.forEach((p) => {
        const username = p.roblox_username || '';
        const name = displayName(p);
        const searchable = ((name + ' ' + username).trim()).toLowerCase();
        const result = resultByUsername[username];
        const hasResult = !!result;
        const placementVal = hasResult ? result.placement : '';
        const pointsVal = hasResult ? result.points : '—';
        const avatarHtml = p.roblox_avatar_url
          ? `<img src="${escapeHtml(p.roblox_avatar_url)}" alt="" class="participant-avatar" loading="lazy" />`
          : '<div class="participant-avatar participant-avatar-placeholder">🎮</div>';
        const row = document.createElement('tr');
        row.dataset.search = searchable;
        row.innerHTML = `
          <td style="text-align: center; font-weight: 600;">${roundNum}</td>
          <td class="participant-cell" style="font-weight: 600;">${avatarHtml}<span class="player-name">${escapeHtml(name)}</span></td>
          <td style="text-align: center;">
            <input 
              type="number" 
              class="form-input existing-placement-input" 
              style="width: 80px; text-align: center; padding: 0.25rem;" 
              value="${placementVal}" 
              min="1" 
              data-match-id="${hasResult ? result.matchId : ''}"
              data-username="${escapeHtml(username)}"
              data-participant-id="${p.id}"
              data-original-placement="${placementVal}"
              data-has-result="${hasResult}"
            >
          </td>
          <td style="text-align: center; font-weight: 600; color: #6ab04c; font-size: 1.125rem;">${pointsVal}</td>
          <td class="existing-results-actions-cell" style="text-align: center;">
            ${hasResult
              ? `<button type="button" class="btn btn-sm btn-secondary btn-existing-update" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">💾 Update</button><button type="button" class="btn btn-sm btn-outline btn-existing-delete" style="padding: 0.25rem 0.75rem; font-size: 0.875rem; color: #40916c; border-color: #40916c;">🗑️ Delete</button>`
              : `<button type="button" class="btn btn-sm btn-primary btn-existing-add" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">➕ Add</button>`
            }
          </td>
        `;
        tbody.appendChild(row);
      });
    }
    // When no round selected, tbody stays empty (already cleared above)

    // Search filter: any space-separated tokens must all appear in the participant name
    if (searchInput) {
      searchInput.oninput = function () {
        const tokens = searchInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        tbody.querySelectorAll('tr').forEach(tr => {
          const text = tr.dataset.search || '';
          tr.style.display = tokens.length === 0 || tokens.every(t => text.includes(t)) ? '' : 'none';
        });
      };
    }
  }

  function handleExistingResultAction(ev) {
    if (!ev.target.closest('#existingResultsBody')) return;
    const btn = ev.target.closest('.btn-existing-update, .btn-existing-delete, .btn-existing-add');
    if (!btn) return;
    ev.preventDefault();
    const row = btn.closest('tr');
    const input = row && row.querySelector('.existing-placement-input');
    const matchId = input && input.dataset.matchId;
    const username = input && input.dataset.username;
    const participantId = input && input.dataset.participantId;
    const hasResult = input && input.dataset.hasResult === 'true';

    if (btn.classList.contains('btn-existing-update')) {
      const newPlacement = input ? parseInt(input.value, 10) : 0;
      const originalPlacement = input ? parseInt(input.dataset.originalPlacement, 10) : NaN;
      if (matchId && username) window.adminUpdateResult(matchId, username, newPlacement, originalPlacement);
      return;
    }
    if (btn.classList.contains('btn-existing-delete')) {
      if (matchId && username) window.adminDeleteResult(matchId, username);
      return;
    }
    if (btn.classList.contains('btn-existing-add')) {
      const placement = parseInt(input && input.value, 10);
      if (!placement || placement < 1) {
        alert('Enter a placement number (1 or higher) before clicking Add.');
        return;
      }
      window.adminAddResult(participantId, username, placement);
    }
  }
  
  window.adminAddResult = async function(participantId, username, placement) {
    const tournamentSelect = document.getElementById('resultsTournament');
    const filterRound = document.getElementById('filterRound');
    const tournament = tournamentSelect ? tournamentSelect.value : '';
    const round = filterRound ? filterRound.value : '';
    if (!tournament || !round || round === 'all') {
      alert('Select a tournament and a round to add a result.');
      return;
    }
    const roundNum = parseInt(round, 10);
    if (isNaN(roundNum) || roundNum < 1) {
      alert('Invalid round.');
      return;
    }
    const points = typeof calculatePoints === 'function' ? calculatePoints(placement) : 0;
    try {
      const supabase = window.supabaseConfig.supabase;
      const TABLES = window.supabaseConfig.TABLES;
      const match = existingResultsMatches.find(m => m.round_number === roundNum);
      if (match && match.scores) {
        const updatedScores = { ...match.scores };
        updatedScores[username] = { placement, points };
        const participantIds = Array.isArray(match.participant_ids) ? [...match.participant_ids] : [];
        if (participantId && !participantIds.includes(participantId)) participantIds.push(participantId);
        const { error: updateError } = await supabase
          .from(TABLES.MATCHES)
          .update({
            scores: updatedScores,
            participant_ids: participantIds.length ? participantIds : undefined
          })
          .eq('id', match.id);
        if (updateError) throw updateError;
        alert('✅ Result added successfully!');
      } else {
        const { error: insertError } = await supabase
          .from(TABLES.MATCHES)
          .insert({
            tournament_id: tournament,
            tournament_type: 'legacy',
            round_number: roundNum,
            match_number: 1,
            participant_ids: participantId ? [participantId] : [],
            scores: { [username]: { placement, points } },
            completed: true,
            completed_at: new Date().toISOString()
          })
          .select()
          .single();
        if (insertError) throw insertError;
        alert('✅ Result added successfully!');
      }
      await loadExistingResults();
    } catch (error) {
      console.error('Error adding result:', error);
      alert('Error adding result: ' + error.message);
    }
  };

  window.adminUpdateResult = async function(matchId, username, newPlacementFromInput, originalPlacementFromInput) {
    const newPlacement = typeof newPlacementFromInput === 'number' ? newPlacementFromInput : parseInt(newPlacementFromInput, 10);
    const originalPlacement = typeof originalPlacementFromInput === 'number' ? originalPlacementFromInput : parseInt(originalPlacementFromInput, 10);

    if (newPlacement === originalPlacement || (isNaN(originalPlacement) && !newPlacement)) {
      alert('No changes detected.');
      return;
    }

    if (!newPlacement || newPlacement < 1) {
      alert('Please enter a valid placement (1 or higher).');
      return;
    }

    if (!confirm(`Update ${username}'s placement from ${originalPlacement || '?'} to ${newPlacement}?`)) {
      return;
    }
    
    try {
      const supabase = window.supabaseConfig.supabase;
      const TABLES = window.supabaseConfig.TABLES;
      
      // Fetch the match
      const { data: match, error: fetchError } = await supabase
        .from(TABLES.MATCHES)
        .select('*')
        .eq('id', matchId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update the scores object
      const updatedScores = { ...match.scores };
      updatedScores[username] = {
        placement: newPlacement,
        points: calculatePoints(newPlacement)
      };
      
      // Update the match in database
      const { error: updateError } = await supabase
        .from(TABLES.MATCHES)
        .update({ scores: updatedScores })
        .eq('id', matchId);
      
      if (updateError) throw updateError;
      
      alert('✅ Result updated successfully!');
      
      // Reload results
      await loadExistingResults();
      
    } catch (error) {
      console.error('Error updating result:', error);
      alert('Error updating result: ' + error.message);
    }
  };
  
  window.adminDeleteResult = async function(matchId, username) {
    if (!confirm(`Are you sure you want to delete ${username}'s result from this round?\n\nThis cannot be undone.`)) {
      return;
    }
    
    try {
      const supabase = window.supabaseConfig.supabase;
      const TABLES = window.supabaseConfig.TABLES;
      
      // Fetch the match
      const { data: match, error: fetchError } = await supabase
        .from(TABLES.MATCHES)
        .select('*')
        .eq('id', matchId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Remove this participant from the scores
      const updatedScores = { ...match.scores };
      delete updatedScores[username];
      
      // If no more participants in this match, delete the entire match
      if (Object.keys(updatedScores).length === 0) {
        const { error: deleteError } = await supabase
          .from(TABLES.MATCHES)
          .delete()
          .eq('id', matchId);
        
        if (deleteError) throw deleteError;
        
        alert('✅ Result deleted (entire match removed as it had no remaining participants).');
      } else {
        // Update the match with remaining participants
        const { error: updateError } = await supabase
          .from(TABLES.MATCHES)
          .update({ scores: updatedScores })
          .eq('id', matchId);
        
        if (updateError) throw updateError;
        
        alert('✅ Result deleted successfully!');
      }
      
      // Reload results
      await loadExistingResults();
      
    } catch (error) {
      console.error('Error deleting result:', error);
      alert('Error deleting result: ' + error.message);
    }
  };

  // ============================================
  // EXPORT TO CSV
  // ============================================
  
  function exportToCSV() {
    if (currentParticipants.length === 0) {
      alert('No participants to export!');
      return;
    }
    
    // Create CSV content
    let csv = 'Number,Roblox Username,Tournament,Signup Time\n';
    
    currentParticipants.forEach((p, index) => {
      csv += `${index + 1},"${p.roblox_username}","${getTournamentName(p.tournament_type)}","${formatDate(p.signup_timestamp)}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // ============================================
  // DEMO DATA
  // ============================================
  
  function loadDemoParticipants() {
    currentParticipants = [
      {
        id: '1',
        roblox_username: 'ProGamer123',
        tournament_type: 'pvp',
        signup_timestamp: new Date().toISOString()
      },
      {
        id: '2',
        roblox_username: 'NinjaWarrior',
        tournament_type: 'pvp',
        signup_timestamp: new Date().toISOString()
      },
      {
        id: '3',
        roblox_username: 'SpeedRunner42',
        tournament_type: 'all-ages',
        signup_timestamp: new Date().toISOString()
      }
    ];
    
    displayParticipantsTable(currentParticipants);
  }
  
  function loadDemoResultsForm() {
    const demoParticipants = [
      { id: '1', roblox_username: 'ProGamer123' },
      { id: '2', roblox_username: 'NinjaWarrior' },
      { id: '3', roblox_username: 'SpeedRunner42' },
      { id: '4', roblox_username: 'CoolPlayer99' },
      { id: '5', roblox_username: 'EpicGamer777' }
    ];
    
    displayResultsForm(demoParticipants, 1);
  }

  // ============================================
  // TOURNAMENT MANAGEMENT
  // ============================================
  
  let currentTournaments = [];
  let editingTournamentId = null;
  
  function setupTournamentManagement() {
    console.log('🔧 Setting up tournament management...');
    const createBtn = document.getElementById('createTournamentBtn');
    const closeBtn = document.getElementById('closeTournamentModal');
    const cancelBtn = document.getElementById('cancelTournamentBtn');
    const form = document.getElementById('tournamentForm');
    
    console.log('📝 Form element found:', form ? 'YES' : 'NO');
    
    if (createBtn) {
      createBtn.addEventListener('click', showCreateTournamentForm);
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeTournamentModal);
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeTournamentModal);
    }
    
    if (form) {
      console.log('✅ Attaching submit handler to form');
      form.addEventListener('submit', handleTournamentSubmit);
    } else {
      console.error('❌ Tournament form not found!');
    }
    
    // Load tournaments when tab is active
    loadTournaments();
  }
  
  async function loadTournaments() {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      return;
    }
    
    const supabase = window.supabaseConfig.supabase;
    
    try {
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error loading tournaments:', error);
        return;
      }
      
      currentTournaments = tournaments || [];
      displayTournamentsTable(currentTournaments);
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  function displayTournamentsTable(tournaments) {
    const tbody = document.getElementById('tournamentsTableBody');
    
    if (tournaments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: #666;">
            No tournaments yet. Click "Create New Tournament" to get started!
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = tournaments.map(t => `
      <tr>
        <td>
          <strong style="color: #28724f;">${escapeHtml(t.name_fr)}</strong><br>
          <small style="color: #666;">${escapeHtml(t.name_en)}</small>
        </td>
        <td>${formatTournamentDate(t.tournament_date)}</td>
        <td><span class="badge badge-${getStatusColor(t.status)}">${t.status}</span></td>
        <td>${t.tournament_type}</td>
        <td>
          <button class="btn btn-outline" style="padding: 0.25rem 0.75rem; font-size: 0.875rem; margin-right: 0.5rem;" onclick="editTournament('${t.id}')">
            ✏️ Edit
          </button>
          <button class="btn btn-accent" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="deleteTournament('${t.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  function formatTournamentDate(dateString) {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function getStatusColor(status) {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'info';
      case 'completed': return 'secondary';
      case 'archived': return 'secondary';
      default: return 'info';
    }
  }
  
  function showCreateTournamentForm() {
    editingTournamentId = null;
    document.getElementById('tournamentFormTitle').textContent = 'Create New Tournament';
    document.getElementById('tournamentForm').reset();
    document.getElementById('tournamentId').value = '';
    document.getElementById('tournamentFormModal').classList.remove('hidden');
  }
  
  window.editTournament = async function(tournamentId) {
    editingTournamentId = tournamentId;
    document.getElementById('tournamentFormTitle').textContent = 'Edit Tournament';
    
    const tournament = currentTournaments.find(t => t.id === tournamentId);
    if (!tournament) return;
    
    // Fill form with tournament data
    document.getElementById('tournamentId').value = tournament.id;
    document.getElementById('nameFr').value = tournament.name_fr || '';
    document.getElementById('nameEn').value = tournament.name_en || '';
    document.getElementById('subtitleFr').value = tournament.subtitle_fr || '';
    document.getElementById('subtitleEn').value = tournament.subtitle_en || '';
    document.getElementById('descriptionFr').value = tournament.description_fr || '';
    document.getElementById('descriptionEn').value = tournament.description_en || '';
    document.getElementById('formatFr').value = tournament.format_fr || '';
    document.getElementById('formatEn').value = tournament.format_en || '';
    document.getElementById('gamePlatform').value = tournament.game_platform || 'Roblox';
    document.getElementById('tournamentType').value = tournament.tournament_type || 'pvp';
    document.getElementById('bracketStyle').value = tournament.bracket_style || 'scoreboard';
    document.getElementById('tournamentStatus').value = tournament.status || 'draft';
    document.getElementById('tournamentTime').value = tournament.tournament_time || '';
    document.getElementById('maxParticipants').value = tournament.max_participants || '';
    document.getElementById('displayOrder').value = tournament.display_order || 1;
    
    // Format date for datetime-local input
    if (tournament.tournament_date) {
      const date = new Date(tournament.tournament_date);
      const formatted = date.toISOString().slice(0, 16);
      document.getElementById('tournamentDate').value = formatted;
    }
    
    document.getElementById('tournamentFormModal').classList.remove('hidden');
  };
  
  function closeTournamentModal() {
    document.getElementById('tournamentFormModal').classList.add('hidden');
    document.getElementById('tournamentForm').reset();
    editingTournamentId = null;
  }
  
  async function handleTournamentSubmit(event) {
    console.log('🚀 TOURNAMENT SUBMIT TRIGGERED!');
    event.preventDefault();
    
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      alert('Supabase not configured!');
      return;
    }
    
    const supabase = window.supabaseConfig.supabase;
    const tournamentId = document.getElementById('tournamentId').value;
    
    // Auto-generate unique tournament_type if creating new
    let tournamentType = document.getElementById('tournamentType').value;
    if (!tournamentId && !tournamentType) {
      // Generate unique type: lowercase-name-timestamp
      const nameSlug = document.getElementById('nameEn').value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 20);
      const timestamp = Date.now();
      tournamentType = `${nameSlug}-${timestamp}`;
      console.log('🔧 Auto-generated tournament_type:', tournamentType);
    }
    
    const tournamentData = {
      name_fr: document.getElementById('nameFr').value,
      name_en: document.getElementById('nameEn').value,
      subtitle_fr: document.getElementById('subtitleFr').value || null,
      subtitle_en: document.getElementById('subtitleEn').value || null,
      description_fr: document.getElementById('descriptionFr').value || null,
      description_en: document.getElementById('descriptionEn').value || null,
      format_fr: document.getElementById('formatFr').value || null,
      format_en: document.getElementById('formatEn').value || null,
      game_platform: document.getElementById('gamePlatform').value,
      tournament_type: tournamentType,
      bracket_style: document.getElementById('bracketStyle').value,
      status: document.getElementById('tournamentStatus').value,
      tournament_date: document.getElementById('tournamentDate').value ? new Date(document.getElementById('tournamentDate').value).toISOString() : null,
      tournament_time: document.getElementById('tournamentTime').value || null,
      max_participants: document.getElementById('maxParticipants').value ? parseInt(document.getElementById('maxParticipants').value) : null,
      display_order: parseInt(document.getElementById('displayOrder').value) || 0,
      updated_at: new Date().toISOString()
    };
    
    console.log('💾 Saving tournament with data:', tournamentData);
    console.log('📋 Bracket Style being saved:', tournamentData.bracket_style);
    
    try {
      let result;
      
      if (tournamentId) {
        // Update existing tournament
        console.log('🔄 Updating tournament ID:', tournamentId);
        result = await supabase
          .from('tournaments')
          .update(tournamentData)
          .eq('id', tournamentId)
          .select(); // Add .select() to return updated data
      } else {
        // Create new tournament
        console.log('✨ Creating new tournament');
        result = await supabase
          .from('tournaments')
          .insert(tournamentData)
          .select(); // Add .select() to return created data
      }
      
      console.log('📊 Database response:', result);
      
      if (result.error) {
        console.error('❌ Error saving tournament:', result.error);
        alert('Error saving tournament: ' + result.error.message);
        return;
      }
      
      if (result.data && result.data.length > 0) {
        console.log('✅ Tournament saved successfully:', result.data[0]);
        console.log('✅ Bracket style in database:', result.data[0].bracket_style);
      }
      
      alert(tournamentId ? 'Tournament updated successfully!' : 'Tournament created successfully!');
      closeTournamentModal();
      loadTournaments();
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error saving tournament: ' + error.message);
    }
  }
  
  window.deleteTournament = async function(tournamentId) {
    if (!confirm('Are you sure you want to delete this tournament? This cannot be undone.')) {
      return;
    }
    
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      return;
    }
    
    const supabase = window.supabaseConfig.supabase;
    
    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId);
      
      if (error) {
        console.error('Error deleting tournament:', error);
        alert('Error deleting tournament');
        return;
      }
      
      alert('Tournament deleted successfully!');
      loadTournaments();
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting tournament');
    }
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

})();
