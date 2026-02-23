// Admin Panel Logic for AFNOO Tournaments
// ENGLISH ONLY - Admin interface

(function() {
  'use strict';


 
  const ADMIN_PASSWORD = 'AFNOO2026!Secure'; 
  
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
  let existingResultsMatches = []; // All matches for selected tournament
  let existingResultsParticipantsAll = []; // All participants for selected tournament (unfiltered)
  let existingResultsParticipants = []; // Participants to show in Edit Existing (filtered by group when group selected)

  // Inline styles so participant rows look the same everywhere (no reliance on CSS load order)
  const ROW_AVATAR_STYLE = 'width:32px;height:32px;min-width:32px;min-height:32px;border-radius:50%;object-fit:cover;border:2px solid rgba(0,0,0,0.1);box-sizing:border-box;display:block;flex-shrink:0';
  const ROW_PLACEHOLDER_STYLE = 'width:32px;height:32px;min-width:32px;min-height:32px;border-radius:50%;border:2px solid rgba(0,0,0,0.1);box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;font-size:1rem;background:#e8ece9;flex-shrink:0';
  const ROW_CELL_STYLE = 'vertical-align:middle;padding:12px 16px;height:48px;max-height:48px;box-sizing:border-box;';
  const ROW_CELL_INNER_STYLE = 'display:flex;align-items:center;gap:8px;min-width:0;';
  const ROW_NAME_STYLE = 'font-size:1rem;font-weight:600;white-space:nowrap;';

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
      return;
    }
    
    const supabase = window.supabaseConfig.supabase;
    
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        return;
      }
      
      adminTournaments = data || [];
      populateAdminTournamentFilters();
      
    } catch (error) {}
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

  /** Even split: same count per group, or +1 for first (total % numGroups) groups. By signup order. */
  function computeGroupAssignments(participantsOrderedBySignup, maxPerGroup) {
    if (!maxPerGroup || maxPerGroup < 1) return null;
    const total = participantsOrderedBySignup.length;
    if (total === 0) return [];
    const numGroups = Math.max(1, Math.ceil(total / maxPerGroup));
    const base = Math.floor(total / numGroups);
    const remainder = total % numGroups;
    const assignments = [];
    let idx = 0;
    for (let g = 1; g <= numGroups; g++) {
      const size = g <= remainder ? base + 1 : base;
      for (let i = 0; i < size && idx < participantsOrderedBySignup.length; i++) {
        assignments.push({ id: participantsOrderedBySignup[idx].id, group_number: g });
        idx++;
      }
    }
    return assignments;
  }

  /** Run auto-split for a tournament: update participant group_number in DB and tournament.number_of_groups. Returns assignments array or null on error. */
  async function runAutoSplitAndSave(tournamentId, participants, maxPerGroup) {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) return null;
    const sorted = [...participants].sort((a, b) => new Date(a.signup_timestamp) - new Date(b.signup_timestamp));
    const assignments = computeGroupAssignments(sorted, maxPerGroup);
    if (!assignments || assignments.length === 0) return null;
    const supabase = window.supabaseConfig.supabase;
    const TABLES = window.supabaseConfig.TABLES;
    const numGroups = Math.max(...assignments.map(a => a.group_number));
    try {
      for (const { id, group_number } of assignments) {
        const { error } = await supabase.from(TABLES.PARTICIPANTS).update({ group_number }).eq('id', id);
        if (error) {
          return null;
        }
      }
      const { error: tErr } = await supabase.from('tournaments').update({ number_of_groups: numGroups }).eq('id', tournamentId);
      return assignments;
    } catch (e) {
      return null;
    }
  }

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
          tournament:tournaments!inner(id, name_en, name_fr, tournament_type, number_of_groups, max_participants_per_group)
        `)
        .order('signup_timestamp', { ascending: false });
      
      // Apply filter using tournament_id
      if (filterTournament !== 'all') {
        query = query.eq('tournament_id', filterTournament);
      }
      
      const { data: participants, error } = await query;
      
      if (error) {
        return;
      }
      
      let list = participants || [];
      // Auto-split runs on signup only (runAutoSplitAndSave). Do NOT run it here on every load - it does one UPDATE per participant and causes ~10s delay when switching tournaments.
      // Auto-close registration when count reaches max_participants (single update, fast)
      if (filterTournament !== 'all' && list.length > 0) {
        const tournament = adminTournaments.find(t => t.id === filterTournament);
        const maxParticipants = tournament && tournament.max_participants != null ? parseInt(tournament.max_participants, 10) : null;
        if (maxParticipants != null && list.length >= maxParticipants && tournament.status !== 'at_capacity') {
          const { error: statusErr } = await supabase.from('tournaments').update({ status: 'at_capacity' }).eq('id', filterTournament);
          if (!statusErr) {
            const tIdx = adminTournaments.findIndex(t => t.id === filterTournament);
            if (tIdx >= 0) adminTournaments[tIdx] = { ...adminTournaments[tIdx], status: 'at_capacity' };
          }
        }
      }
      currentParticipants = list;
      displayParticipantsTable(currentParticipants);
      const recalcBtn = document.getElementById('recalculateGroupsBtn');
      if (recalcBtn) {
        const tid = document.getElementById('filterTournament').value;
        const t = tid && tid !== 'all' ? adminTournaments.find(x => x.id === tid) : null;
        recalcBtn.style.display = t && t.max_participants_per_group != null ? '' : 'none';
      }
    } catch (error) {
    }
  }
  
  function displayParticipantsTable(participants) {
    const tbody = document.getElementById('participantsTableBody');
    
    if (participants.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
            No participants yet. Waiting for signups...
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = participants.map((p, index) => {
      // Get tournament name and number_of_groups from joined data or fallback (use max group in list so auto-split is reflected)
      const tournament = p.tournament;
      const tournamentName = tournament 
        ? (tournament.name_en || tournament.name_fr || 'Unknown Tournament')
        : (adminTournaments.find(t => t.id === p.tournament_id)?.name_en || p.tournament_type || 'Unknown');
      const sameTournament = participants.filter(x => x.tournament_id === p.tournament_id);
      const maxGroupInList = sameTournament.length ? Math.max(...sameTournament.map(x => x.group_number != null ? x.group_number : 1)) : 1;
      const numGroups = Math.max(1, (tournament && tournament.number_of_groups != null) ? tournament.number_of_groups : (adminTournaments.find(t => t.id === p.tournament_id)?.number_of_groups) || 0, maxGroupInList);
      const currentGroup = p.group_number != null ? p.group_number : 1;
      const groupOptions = Array.from({ length: numGroups }, (_, i) => i + 1)
        .map(n => `<option value="${n}" ${n === currentGroup ? 'selected' : ''}>Group ${n}</option>`).join('');
      
      return `
      <tr>
        <td style="vertical-align:middle;padding:12px 16px;min-height:48px;">${index + 1}</td>
        <td style="${ROW_CELL_STYLE} color: #28724f;"><div class="participant-cell-inner" style="${ROW_CELL_INNER_STYLE}">${(window.supabaseConfig && window.supabaseConfig.getDisplayAvatarUrl(p.roblox_avatar_url)) ? `<img width="32" height="32" src="${escapeHtml(window.supabaseConfig.getDisplayAvatarUrl(p.roblox_avatar_url))}" alt="" loading="lazy" style="${ROW_AVATAR_STYLE}" />` : `<div style="${ROW_PLACEHOLDER_STYLE}">🎮</div>`}<span style="${ROW_NAME_STYLE}">${escapeHtml((p.roblox_display_name || p.roblox_username || '').trim() || p.roblox_username)}</span></div></td>
        <td style="vertical-align:middle;padding:12px 16px;min-height:48px;">${escapeHtml(tournamentName)}</td>
        <td style="vertical-align:middle;padding:12px 16px;min-height:48px;">
          <select class="form-input" style="min-width:100px;padding:4px 8px;" data-participant-id="${p.id}" onchange="updateParticipantGroup('${p.id}', parseInt(this.value))">${groupOptions}</select>
        </td>
        <td style="vertical-align:middle;padding:12px 16px;min-height:48px;">${formatDate(p.signup_timestamp)}</td>
        <td style="vertical-align:middle;padding:12px 16px;min-height:48px;">
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
  
  window.updateParticipantGroup = async function(participantId, groupNumber) {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) return;
    const supabase = window.supabaseConfig.supabase;
    const TABLES = window.supabaseConfig.TABLES;
    const { error } = await supabase.from(TABLES.PARTICIPANTS).update({ group_number: groupNumber }).eq('id', participantId);
    if (error) {
      alert('Failed to update group');
    } else {
      loadParticipants();
    }
  };

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
    const recalcGroupsBtn = document.getElementById('recalculateGroupsBtn');
    if (recalcGroupsBtn) {
      recalcGroupsBtn.addEventListener('click', async () => {
        const tid = document.getElementById('filterTournament').value;
        if (!tid || tid === 'all') return;
        recalcGroupsBtn.disabled = true;
        try {
          const { data, error } = await window.supabaseConfig.supabase.functions.invoke('auto-split-groups', { body: { tournament_id: tid } });
          await loadParticipants();
        } finally {
          recalcGroupsBtn.disabled = false;
        }
      });
    }
    
    // Existing results management
    document.getElementById('resultsTournament').addEventListener('change', () => {
      updateResultsGroupDropdowns();
      loadExistingResults();
    });
    document.getElementById('refreshExistingBtn').addEventListener('click', loadExistingResults);
    document.getElementById('filterRound').addEventListener('change', () => {
      if (existingResultsMatches.length > 0) {
        displayExistingResults(existingResultsMatches);
      }
    });
    const filterResultsGroupEl = document.getElementById('filterResultsGroup');
    if (filterResultsGroupEl) filterResultsGroupEl.addEventListener('change', () => {
      const filterGroupVal = filterResultsGroupEl.value;
      const groupFilter = filterGroupVal !== '' ? parseInt(filterGroupVal, 10) : null;
      const matchesToUse = groupFilter != null
        ? existingResultsMatches.filter(m => (m.group_number != null ? m.group_number : 1) === groupFilter)
        : existingResultsMatches;
      existingResultsParticipants = groupFilter != null
        ? existingResultsParticipantsAll.filter(p => (p.group_number != null ? p.group_number : 1) === groupFilter)
        : existingResultsParticipantsAll;
      displayExistingResults(matchesToUse);
    });
    const existingContent = document.getElementById('existingResultsContent');
    if (existingContent) existingContent.addEventListener('click', handleExistingResultAction);
  }
  
  function updateResultsGroupDropdowns() {
    const tid = document.getElementById('resultsTournament').value;
    const newWrap = document.getElementById('resultsNewGroupWrap');
    const newSelect = document.getElementById('resultsGroup');
    const existingWrap = document.getElementById('existingResultsGroupWrap');
    const existingSelect = document.getElementById('filterResultsGroup');
    const t = tid ? adminTournaments.find(x => x.id === tid) : null;
    const numGroups = t && t.number_of_groups != null && t.number_of_groups >= 1 ? parseInt(t.number_of_groups, 10) : 1;
    if (numGroups > 1) {
      if (newWrap) newWrap.style.display = '';
      if (newSelect) {
        newSelect.innerHTML = Array.from({ length: numGroups }, (_, i) => i + 1).map(n => `<option value="${n}">Group ${n}</option>`).join('');
      }
      if (existingWrap) existingWrap.style.display = '';
      if (existingSelect) {
        const current = existingSelect.value;
        existingSelect.innerHTML = '<option value="">All groups</option>' + Array.from({ length: numGroups }, (_, i) => i + 1).map(n => `<option value="${n}">Group ${n}</option>`).join('');
        if (current && parseInt(current, 10) <= numGroups) existingSelect.value = current;
      }
    } else {
      if (newWrap) newWrap.style.display = 'none';
      if (existingWrap) existingWrap.style.display = 'none';
      if (newSelect) newSelect.innerHTML = '<option value="1">Group 1</option>';
      if (existingSelect) existingSelect.innerHTML = '<option value="">All groups</option><option value="1">Group 1</option>';
    }
  }

  async function loadResultsForm() {
    const tournament = document.getElementById('resultsTournament').value;
    const round = document.getElementById('resultsRound').value;
    const groupNum = parseInt(document.getElementById('resultsGroup')?.value || '1', 10) || 1;
    
    if (!tournament) {
      alert('Please select a tournament first');
      return;
    }
    
    try {
      if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
        loadDemoResultsForm();
        return;
      }
      
      const supabase = window.supabaseConfig.supabase;
      const TABLES = window.supabaseConfig.TABLES;
      
      const roundNum = parseInt(round, 10);
      if (!isNaN(roundNum)) {
        const { data: existingMatches, error: checkErr } = await supabase
          .from(TABLES.MATCHES)
          .select('id, group_number')
          .eq('tournament_id', tournament)
          .eq('round_number', roundNum);
        const hasResultForGroup = !checkErr && existingMatches && existingMatches.some(m => (m.group_number != null ? m.group_number : 1) === groupNum);
        if (hasResultForGroup) {
          alert(`Round ${round}${groupNum > 1 ? ' (Group ' + groupNum + ')' : ''} already has results.\n\nUse "Edit Existing Results" to view or edit, or pick a different round/group.`);
          return;
        }
      }
      
      const { data: participants, error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .select('*')
        .eq('tournament_id', tournament)
        .eq('group_number', groupNum)
        .order('roblox_username', { ascending: true });
      
      if (error) {
        return;
      }
      
      if (!participants || participants.length === 0) {
        alert('No participants registered for this tournament yet!');
        return;
      }
      
      displayResultsForm(participants, round);
      
    } catch (error) {
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
      <tr data-search="${escapeHtml(searchable)}" style="height: 48px;">
        <td style="vertical-align: middle; padding: 12px 16px; height: 48px; box-sizing: border-box;">${index + 1}</td>
        <td style="${ROW_CELL_STYLE}"><div class="participant-cell-inner" style="${ROW_CELL_INNER_STYLE}">${(window.supabaseConfig && window.supabaseConfig.getDisplayAvatarUrl(p.roblox_avatar_url)) ? `<img width="32" height="32" src="${escapeHtml(window.supabaseConfig.getDisplayAvatarUrl(p.roblox_avatar_url))}" alt="" loading="lazy" style="${ROW_AVATAR_STYLE}" />` : `<div style="${ROW_PLACEHOLDER_STYLE}">🎮</div>`}<span style="${ROW_NAME_STYLE}">${escapeHtml(displayName(p))}</span></div></td>
        <td style="vertical-align: middle; padding: 12px 16px; height: 48px; box-sizing: border-box;">
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
        <td style="vertical-align: middle; padding: 12px 16px; height: 48px; box-sizing: border-box;">
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
    const groupNum = parseInt(document.getElementById('resultsGroup')?.value || '1', 10) || 1;
    
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
          tournament_type: 'legacy',
          round_number: parseInt(round),
          group_number: groupNum,
          match_number: 1,
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
      
      
      // Reload existing results after saving
      await loadExistingResults();
      
    } catch (error) {
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
        alert('Error loading results: ' + error.message);
        return;
      }
      existingResultsParticipantsAll = participants || [];


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
      const filterGroupVal = document.getElementById('filterResultsGroup')?.value || '';
      const groupFilter = filterGroupVal !== '' ? parseInt(filterGroupVal, 10) : null;
      const matchesToUse = groupFilter != null
        ? matches.filter(m => (m.group_number != null ? m.group_number : 1) === groupFilter)
        : matches;
      existingResultsParticipants = groupFilter != null
        ? (participants || []).filter(p => (p.group_number != null ? p.group_number : 1) === groupFilter)
        : (participants || []);

      const rounds = [...new Set(matchesToUse.map(m => m.round_number))].sort((a, b) => a - b);
      const filterRound = document.getElementById('filterRound');
      const currentFilter = filterRound.value;
      filterRound.innerHTML = '<option value="">Select round</option>' +
        rounds.map(r => `<option value="${r}">Round ${r}</option>`).join('');
      if (rounds.includes(Number(currentFilter))) {
        filterRound.value = currentFilter;
      } else {
        filterRound.value = '';
      }

      displayExistingResults(matchesToUse);
    } catch (error) {
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
      // Round selected: show participants; look up result from the match for this round AND participant's group (so "All groups" shows all groups' placements)
      const resultByUsername = {};
      matches.filter(m => m.round_number === roundNum).forEach(match => {
        if (match && match.scores) {
          Object.entries(match.scores).forEach(([username, scoreData]) => {
            resultByUsername[username] = { placement: scoreData.placement, points: scoreData.points, matchId: match.id };
          });
        }
      });
      existingResultsParticipants.forEach((p) => {
        const username = p.roblox_username || '';
        const name = displayName(p);
        const searchable = ((name + ' ' + username).trim()).toLowerCase();
        const result = resultByUsername[username];
        const hasResult = !!result;
        const placementVal = hasResult ? result.placement : '';
        const pointsVal = hasResult ? result.points : '—';
        const displayAvatarUrl = window.supabaseConfig ? window.supabaseConfig.getDisplayAvatarUrl(p.roblox_avatar_url) : p.roblox_avatar_url;
        const avatarHtml = displayAvatarUrl
          ? `<img width="32" height="32" src="${escapeHtml(displayAvatarUrl)}" alt="" loading="lazy" style="${ROW_AVATAR_STYLE}" />`
          : `<div style="${ROW_PLACEHOLDER_STYLE}">🎮</div>`;
        const row = document.createElement('tr');
        row.dataset.search = searchable;
        row.innerHTML = `
          <td style="text-align: center; font-weight: 600; vertical-align: middle; padding: 12px 16px; height: 48px; box-sizing: border-box;">${roundNum}</td>
          <td style="${ROW_CELL_STYLE}"><div class="participant-cell-inner" style="${ROW_CELL_INNER_STYLE}">${avatarHtml}<span style="${ROW_NAME_STYLE}">${escapeHtml(name)}</span></div></td>
          <td style="text-align: center; vertical-align: middle; padding: 12px 16px; height: 48px; box-sizing: border-box;">
            <input 
              type="number" 
              class="form-input existing-placement-input" 
              style="width: 80px; text-align: center;" 
              value="${placementVal}" 
              min="1" 
              data-match-id="${hasResult ? result.matchId : ''}"
              data-username="${escapeHtml(username)}"
              data-participant-id="${p.id}"
              data-original-placement="${placementVal}"
              data-has-result="${hasResult}"
            >
          </td>
          <td style="text-align: center; vertical-align: middle; padding: 12px 16px; height: 48px; box-sizing: border-box; font-weight: 600; color: #6ab04c; font-size: 1.125rem;">${pointsVal}</td>
          <td class="existing-results-actions-cell" style="text-align: center; vertical-align: middle; padding: 12px 16px; height: 48px; box-sizing: border-box;">
            <div class="existing-results-actions-inner">
            ${hasResult
              ? `<button type="button" class="btn btn-sm btn-secondary btn-existing-update" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">💾 Save</button><button type="button" class="btn btn-sm btn-outline btn-existing-delete" style="padding: 0.25rem 0.5rem; font-size: 0.875rem; color: #40916c; border-color: #40916c;" aria-label="Delete">🗑️</button>`
              : `<button type="button" class="btn btn-sm btn-primary btn-existing-add" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">➕ Add</button>`
            }
            </div>
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
    const filterGroupEl = document.getElementById('filterResultsGroup');
    const tournament = tournamentSelect ? tournamentSelect.value : '';
    const round = filterRound ? filterRound.value : '';
    const groupNum = filterGroupEl && filterGroupEl.value !== '' ? parseInt(filterGroupEl.value, 10) : 1;
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
      const match = existingResultsMatches.find(m => m.round_number === roundNum && (m.group_number != null ? m.group_number : 1) === groupNum);
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
            group_number: groupNum,
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
    const createBtn = document.getElementById('createTournamentBtn');
    const closeBtn = document.getElementById('closeTournamentModal');
    const cancelBtn = document.getElementById('cancelTournamentBtn');
    const form = document.getElementById('tournamentForm');
    
    
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
      form.addEventListener('submit', handleTournamentSubmit);
    } else {
    }
    
    // Load tournaments when tab is active
    loadTournaments();
  }
  
  async function loadTournaments() {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      return;
    }
    
    const supabase = window.supabaseConfig.supabase;
    
    try {
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) {
        return;
      }
      
      currentTournaments = tournaments || [];
      displayTournamentsTable(currentTournaments);
    } catch (error) {
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
    document.getElementById('maxParticipantsPerGroup').value = tournament.max_participants_per_group != null ? tournament.max_participants_per_group : '';
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
      max_participants_per_group: document.getElementById('maxParticipantsPerGroup').value ? parseInt(document.getElementById('maxParticipantsPerGroup').value) : null,
      display_order: parseInt(document.getElementById('displayOrder').value) || 0,
      updated_at: new Date().toISOString()
    };
    
    
    try {
      let result;
      
      if (tournamentId) {
        // Update existing tournament
        result = await supabase
          .from('tournaments')
          .update(tournamentData)
          .eq('id', tournamentId)
          .select(); // Add .select() to return updated data
      } else {
        // Create new tournament
        result = await supabase
          .from('tournaments')
          .insert(tournamentData)
          .select(); // Add .select() to return created data
      }
      
      
      if (result.error) {
        alert('Error saving tournament: ' + result.error.message);
        return;
      }
      
      if (result.data && result.data.length > 0) {
      }
      
      alert(tournamentId ? 'Tournament updated successfully!' : 'Tournament created successfully!');
      closeTournamentModal();
      loadTournaments();
    } catch (error) {
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
        alert('Error deleting tournament');
        return;
      }
      
      alert('Tournament deleted successfully!');
      loadTournaments();
    } catch (error) {
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
