// Signup Form Logic for AFNOO Tournaments
// Handles Roblox username validation and registration

(function() {
  'use strict';

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', initSignupForm);

  async function initSignupForm() {
    // Load tournaments first
    await loadTournaments();
    
    const form = document.getElementById('signupForm');
    const usernameInput = document.getElementById('robloxUsername');
    
    // Real-time username validation (debounced)
    let validationTimeout;
    usernameInput.addEventListener('input', function() {
      clearTimeout(validationTimeout);
      validationTimeout = setTimeout(() => validateUsername(), 800);
    });
    
    // Form submission
    form.addEventListener('submit', handleSubmit);
    
    // Pre-select tournament based on URL parameter
    preselectTournament();
    
    // Listen for language changes
    window.addEventListener('languageChanged', loadTournaments);
  }
  
  // ============================================
  // LOAD TOURNAMENTS FROM DATABASE
  // ============================================
  
  async function loadTournaments() {
    const container = document.getElementById('tournamentOptionsContainer');
    if (!container) return;
    
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      container.innerHTML = '<div style="color: #E63946; padding: 1rem;">Unable to load tournaments. Please refresh the page.</div>';
      return;
    }
    
    const supabase = window.supabaseConfig.supabase;
    
    try {
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'published')  // Only show published tournaments (signups open)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error loading tournaments:', error);
        container.innerHTML = '<div style="color: #E63946; padding: 1rem;">Error loading tournaments</div>';
        return;
      }
      
      if (!tournaments || tournaments.length === 0) {
        container.innerHTML = '<div style="color: #666; padding: 1rem;">No tournaments available at the moment.</div>';
        return;
      }
      
      const currentLang = window.i18n ? window.i18n.currentLang : 'fr';
      
      container.innerHTML = tournaments.map((tournament, index) => {
        const name = currentLang === 'fr' ? tournament.name_fr : tournament.name_en;
        const subtitle = currentLang === 'fr' ? tournament.subtitle_fr : tournament.subtitle_en;
        const format = currentLang === 'fr' ? tournament.format_fr : tournament.format_en;
        
        return `
          <div class="form-radio">
            <input 
              type="radio" 
              id="tournament-${tournament.id}" 
              name="tournament" 
              value="${escapeHtml(tournament.tournament_type)}"
              data-tournament-id="${tournament.id}"
              required
            >
            <label for="tournament-${tournament.id}" class="form-radio-label">
              <strong>${escapeHtml(name)}</strong>${subtitle ? ` - <span>${escapeHtml(subtitle)}</span>` : ''}
              <br>
              <small style="color: #666;">
                📱 ${escapeHtml(tournament.game_platform || 'Roblox')}${format ? ` • ${escapeHtml(format)}` : ''}
              </small>
            </label>
          </div>
        `;
      }).join('');
      
      // Re-select tournament from URL if it was previously selected
      preselectTournament();
    } catch (error) {
      console.error('Error:', error);
      container.innerHTML = '<div style="color: #E63946; padding: 1rem;">Error loading tournaments</div>';
    }
  }
  
  function preselectTournament() {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentType = urlParams.get('tournament');
    
    if (tournamentType) {
      const radio = document.querySelector(`input[name="tournament"][value="${tournamentType}"]`);
      if (radio) {
        radio.checked = true;
      }
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
  // ROBLOX USERNAME VALIDATION
  // ============================================
  
  async function validateUsername() {
    const usernameInput = document.getElementById('robloxUsername');
    const username = usernameInput.value.trim();
    const errorDiv = document.getElementById('usernameError');
    const successDiv = document.getElementById('usernameSuccess');
    
    // Clear previous messages
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    // Check if empty
    if (!username) {
      return;
    }
    
    // Check format (3-20 chars, alphanumeric + underscore)
    const validFormat = /^[A-Za-z0-9_]{3,20}$/.test(username);
    if (!validFormat) {
      showError(errorDiv, window.i18n.t('signup.errorInvalidUsername'));
      return false;
    }
    
    // Show success for valid format
    showSuccess(successDiv, `✓ ${username}`);
    return true;
  }
  
  // ============================================
  // FORM SUBMISSION
  // ============================================
  
  async function handleSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = document.getElementById('submitBtn');
    const loadingState = document.getElementById('loadingState');
    
    // HONEYPOT CHECK - if filled, silently reject (bots fill hidden fields)
    const honeypot = document.getElementById('website').value;
    if (honeypot && honeypot.trim() !== '') {
      // Bot detected! Show fake success to confuse the bot
      console.warn('🤖 Bot detected via honeypot');
      setTimeout(() => {
        showSuccessPage({
          id: 'BOT-DETECTED',
          username: 'Bot',
          tournament: 'none'
        });
      }, 2000);
      return;
    }
    
    // Get form data
    const tournamentRadio = document.querySelector('input[name="tournament"]:checked');
    const formData = {
      robloxUsername: document.getElementById('robloxUsername').value.trim(),
      tournament: tournamentRadio?.value,
      tournamentId: tournamentRadio?.dataset.tournamentId, // Get the UUID
      ageConfirm: document.getElementById('ageConfirm').checked,
      rulesAccept: document.getElementById('rulesAccept').checked,
      honeypot: honeypot // Include for database-level check too
    };
    
    // Validate all fields
    const isValid = await validateForm(formData);
    if (!isValid) {
      return;
    }
    
    // Disable submit button and show loading
    submitBtn.disabled = true;
    loadingState.classList.remove('hidden');
    
    try {
      // Check if Supabase is configured
      if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
        // Fallback: Show success without saving to database
        console.warn('Supabase not configured. Registration not saved to database.');
        showSuccessPage({
          id: 'DEMO-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          username: formData.robloxUsername,
          tournament: formData.tournament
        });
        return;
      }
      
      // Save to Supabase
      const result = await saveToDatabase(formData);
      
      // Show success page
      showSuccessPage(result);
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Show error message
      if (error.message.includes('already registered')) {
        alert(window.i18n.t('signup.errorAlreadyRegistered'));
      } else {
        alert(window.i18n.t('signup.errorServerError'));
      }
      
      // Re-enable submit button
      submitBtn.disabled = false;
      loadingState.classList.add('hidden');
    }
  }
  
  // Validate entire form
  async function validateForm(formData) {
    let isValid = true;
    
    // Validate username
    const usernameValid = await validateUsername();
    if (!usernameValid) {
      isValid = false;
    }
    
    // Validate tournament selection
    if (!formData.tournament) {
      const errorDiv = document.getElementById('tournamentError');
      showError(errorDiv, window.i18n.t('signup.errorSelectTournament'));
      isValid = false;
    }
    
    // Validate age confirmation
    if (!formData.ageConfirm) {
      const errorDiv = document.getElementById('ageError');
      showError(errorDiv, window.i18n.t('signup.errorAgeConfirm'));
      isValid = false;
    }
    
    // Validate rules acceptance
    if (!formData.rulesAccept) {
      const errorDiv = document.getElementById('rulesError');
      showError(errorDiv, window.i18n.t('signup.errorRulesConfirm'));
      isValid = false;
    }
    
    return isValid;
  }

  // ============================================
  // DATABASE OPERATIONS
  // ============================================
  
  async function saveToDatabase(formData) {
    const supabase = window.supabaseConfig.supabase;
    const TABLES = window.supabaseConfig.TABLES;
    
    // Normalize username (case-insensitive check)
    // Check for duplicate registration using tournament_id with case-insensitive username
    const { data: existing, error: checkError} = await supabase
      .from(TABLES.PARTICIPANTS)
      .select('*')
      .ilike('roblox_username', formData.robloxUsername) // Case-insensitive
      .eq('tournament_id', formData.tournamentId);
    
    if (checkError) {
      throw new Error('Database check error: ' + checkError.message);
    }
    
    if (existing && existing.length > 0) {
      throw new Error('User already registered for this tournament');
    }
    
    // Insert new participant with tournament_id
    const { data, error } = await supabase
      .from(TABLES.PARTICIPANTS)
      .insert({
        roblox_username: formData.robloxUsername,
        tournament_id: formData.tournamentId,
        tournament_type: formData.tournament, // Keep for backwards compatibility
        honeypot: null // Always null for real users (bots would fill this)
      })
      .select()
      .single();
    
    if (error) {
      throw new Error('Registration error: ' + error.message);
    }

    // Fetch Roblox display name + avatar via Edge Function (updates participant row server-side)
    supabase.functions.invoke('Robloxuserinfo', {
      body: { username: formData.robloxUsername, participant_id: data.id }
    }).then(({ error: fnErr }) => {
      if (fnErr) console.warn('Roblox profile fetch failed (optional):', fnErr);
    }).catch(() => {});

    return {
      id: data.id.substring(0, 8).toUpperCase(),
      username: formData.robloxUsername,
      tournament: formData.tournament
    };
  }

  // ============================================
  // UI HELPERS
  // ============================================
  
  function showError(element, message) {
    element.textContent = '⚠️ ' + message;
    element.classList.remove('hidden');
  }
  
  function showSuccess(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
  }
  
  function showSuccessPage(data) {
    // Hide form, show success message
    document.getElementById('signupFormContainer').classList.add('hidden');
    document.getElementById('successContainer').classList.remove('hidden');
    
    // Populate success message data
    document.getElementById('registrationId').textContent = '#' + data.id;
    document.getElementById('confirmedUsername').textContent = data.username;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

})();
