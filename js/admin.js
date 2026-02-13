// Admin Panel Logic for Le Centre Franco Tournaments
// ENGLISH ONLY - Admin interface

(function() {
  'use strict';

  // ADMIN PASSWORD - Keep this secure!
  // ⚠️ This is visible in public GitHub - change regularly
  const ADMIN_PASSWORD = 'CentroFranco2026!Secure'; // TODO: Use proper hashing in production
  
  // Point values for placements (customize as needed)
  const POINT_SCALE = {
    1: 100,  // 1st place
    2: 80,   // 2nd place
    3: 65,   // 3rd place
    4: 50,   // 4th place
    5: 40,   // 5th place
    6: 30,   // 6th place
    7: 20,   // 7th place
    8: 10,   // 8th place
    default: 5  // 9th place and below
  };

  let isAuthenticated = false;
  let currentParticipants = [];

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
  
  function initAdmin() {
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
      
      let query = supabase
        .from(TABLES.PARTICIPANTS)
        .select('*')
        .order('signup_timestamp', { ascending: false });
      
      // Apply filter
      if (filterTournament !== 'all') {
        query = query.eq('tournament_type', filterTournament);
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
    
    tbody.innerHTML = participants.map((p, index) => `
      <tr>
        <td>${index + 1}</td>
        <td style="font-weight: 600; color: #005CA9;">${escapeHtml(p.roblox_username)}</td>
        <td>${getTournamentName(p.tournament_type)}</td>
        <td>${formatDate(p.signup_timestamp)}</td>
        <td>
          <button class="btn btn-accent" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;" onclick="deleteParticipant('${p.id}')">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  function getTournamentName(type) {
    return type === 'pvp' ? 'RIVALS (13-18)' : 'Racing (All Ages)';
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
    document.getElementById('loadResultsBtn').addEventListener('click', loadResultsForm);
    document.getElementById('filterTournament').addEventListener('change', loadParticipants);
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
      
      const { data: participants, error } = await supabase
        .from(TABLES.PARTICIPANTS)
        .select('*')
        .eq('tournament_type', tournament)
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
    
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = participants.map((p, index) => `
      <tr>
        <td>${index + 1}</td>
        <td style="font-weight: 600;">${escapeHtml(p.roblox_username)}</td>
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
    `).join('');
    
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
    return POINT_SCALE[placement] || POINT_SCALE.default;
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
      
      // Create match record
      const { data: match, error: matchError } = await supabase
        .from(TABLES.MATCHES)
        .insert({
          tournament_type: tournament,
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
      
    } catch (error) {
      console.error('Error saving results:', error);
      alert('Error saving results: ' + error.message);
    }
  }

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
          <strong style="color: #005CA9;">${escapeHtml(t.name_fr)}</strong><br>
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
    event.preventDefault();
    
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      alert('Supabase not configured!');
      return;
    }
    
    const supabase = window.supabaseConfig.supabase;
    const tournamentId = document.getElementById('tournamentId').value;
    
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
      tournament_type: document.getElementById('tournamentType').value,
      bracket_style: document.getElementById('bracketStyle').value,
      status: document.getElementById('tournamentStatus').value,
      tournament_date: document.getElementById('tournamentDate').value ? new Date(document.getElementById('tournamentDate').value).toISOString() : null,
      tournament_time: document.getElementById('tournamentTime').value || null,
      max_participants: document.getElementById('maxParticipants').value ? parseInt(document.getElementById('maxParticipants').value) : null,
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
          .eq('id', tournamentId);
      } else {
        // Create new tournament
        result = await supabase
          .from('tournaments')
          .insert(tournamentData);
      }
      
      if (result.error) {
        console.error('Error saving tournament:', result.error);
        alert('Error saving tournament: ' + result.error.message);
        return;
      }
      
      alert(tournamentId ? 'Tournament updated successfully!' : 'Tournament created successfully!');
      closeTournamentModal();
      loadTournaments();
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving tournament');
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
