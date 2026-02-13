// Landing Page Dynamic Tournament Loading
// Fetches tournaments from Supabase and generates cards dynamically

(function() {
  'use strict';

  let tournaments = [];
  let countdownIntervals = [];

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    await loadTournaments();
    
    // Listen for language changes
    window.addEventListener('languageChanged', renderTournaments);
  }

  // ============================================
  // LOAD TOURNAMENTS FROM DATABASE
  // ============================================
  
  async function loadTournaments() {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) {
      console.warn('Supabase not configured');
      showError();
      return;
    }
    
    const supabase = window.supabaseConfig.supabase;
    
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .in('status', ['published', 'in-progress', 'completed'])
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error loading tournaments:', error);
        showError();
        return;
      }
      
      tournaments = data || [];
      
      if (tournaments.length === 0) {
        showNoTournaments();
      } else {
        renderTournaments();
      }
    } catch (error) {
      console.error('Error:', error);
      showError();
    }
  }

  // ============================================
  // RENDER TOURNAMENTS
  // ============================================
  
  function renderTournaments() {
    const container = document.getElementById('tournamentsContainer');
    if (!container) return;
    
    // Clear existing intervals
    countdownIntervals.forEach(interval => clearInterval(interval));
    countdownIntervals = [];
    
    const currentLang = window.i18n ? window.i18n.currentLang : 'fr';
    
    container.innerHTML = tournaments.map((tournament, index) => 
      generateTournamentCard(tournament, index, currentLang)
    ).join('');
    
    // Start countdowns
    tournaments.forEach((tournament, index) => {
      if (tournament.tournament_date) {
        const interval = setInterval(() => {
          updateCountdown(tournament, index);
        }, 1000);
        countdownIntervals.push(interval);
        
        // Initial update
        updateCountdown(tournament, index);
      }
    });
  }
  
  function generateTournamentCard(tournament, index, lang) {
    const name = lang === 'fr' ? tournament.name_fr : tournament.name_en;
    const subtitle = lang === 'fr' ? tournament.subtitle_fr : tournament.subtitle_en;
    const description = lang === 'fr' ? tournament.description_fr : tournament.description_en;
    const format = lang === 'fr' ? tournament.format_fr : tournament.format_en;
    
    const dateObj = tournament.tournament_date ? new Date(tournament.tournament_date) : null;
    const dateDisplay = dateObj ? formatDate(dateObj, lang) : (lang === 'fr' ? 'À déterminer' : 'TBD');
    
    return `
      <article class="tournament-card">
        <h3 class="tournament-card-title">${escapeHtml(name)}</h3>
        ${subtitle ? `<p class="tournament-card-subtitle">${escapeHtml(subtitle)}</p>` : ''}
        ${description ? `<p class="tournament-card-desc">${escapeHtml(description)}</p>` : ''}
        
        <!-- Tournament Details -->
        <div style="margin-bottom: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 8px;">
          <p style="margin: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">📱</span>
            <strong><span data-i18n="landing.platformLabel">Plateforme</span></strong>: ${escapeHtml(tournament.game_platform || 'Roblox')}
          </p>
          <p style="margin: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">📅</span>
            <strong><span data-i18n="landing.dateLabel">Date</span></strong>: ${dateDisplay}
          </p>
          <p style="margin: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">🕐</span>
            <strong><span data-i18n="landing.timeLabel">Heure</span></strong>: ${escapeHtml(tournament.tournament_time || 'TBD')}
          </p>
          ${format ? `
          <p style="margin: 0.5rem 0; display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">🎮</span>
            <strong><span data-i18n="landing.formatLabel">Format</span></strong>: ${escapeHtml(format)}
          </p>
          ` : ''}
        </div>
        
        <!-- Countdown Timer -->
        <div id="countdown${index}Container" style="display: none; margin: 1rem 0; padding: 1rem; background: linear-gradient(135deg, ${index % 2 === 0 ? '#005CA9 0%, #004a8a' : '#8DC63F 0%, #7ab62f'} 100%); border-radius: 8px; color: white; text-align: center;">
          <p style="margin: 0 0 0.5rem 0; font-weight: 600; opacity: 0.9;">⏱️ <span data-i18n="landing.countdownStarts">Commence dans</span>:</p>
          <div style="display: flex; justify-content: center; gap: 0.75rem; font-family: 'Poppins', sans-serif;">
            <div>
              <span id="countdown${index}-days" style="font-size: 1.5rem; font-weight: 700;">00</span><span style="font-size: 0.75rem; opacity: 0.8;">j</span>
            </div>
            <div>
              <span id="countdown${index}-hours" style="font-size: 1.5rem; font-weight: 700;">00</span><span style="font-size: 0.75rem; opacity: 0.8;">h</span>
            </div>
            <div>
              <span id="countdown${index}-minutes" style="font-size: 1.5rem; font-weight: 700;">00</span><span style="font-size: 0.75rem; opacity: 0.8;">m</span>
            </div>
            <div>
              <span id="countdown${index}-seconds" style="font-size: 1.5rem; font-weight: 700;">00</span><span style="font-size: 0.75rem; opacity: 0.8;">s</span>
            </div>
          </div>
        </div>
        
        ${tournament.status === 'completed' ? `
          <a href="results.html?tournament=${encodeURIComponent(tournament.tournament_type)}" class="btn" style="width: 100%; margin-top: 1rem; background: linear-gradient(135deg, #8DC63F 0%, #7ab62f 100%); color: white;">
            ✓ <span data-i18n="landing.tournamentCompleted">Tournoi terminé</span> - <span data-i18n="landing.viewResults">Voir les résultats</span>
          </a>
        ` : tournament.status === 'in-progress' ? `
          <div style="margin-top: 1rem; padding: 1rem; background: linear-gradient(135deg, #E6007E 0%, #c4005f 100%); border-radius: 8px; text-align: center;">
            <p style="color: white; font-weight: 700; font-size: 1.125rem; margin: 0;">
              🏆 <span data-i18n="landing.tournamentInProgress">Tournoi en cours</span>
            </p>
            <p style="color: rgba(255,255,255,0.9); font-size: 0.875rem; margin: 0.5rem 0 0 0;">
              <span data-i18n="landing.signupClosed">Inscriptions fermées</span>
            </p>
          </div>
        ` : `
          <a href="signup.html?tournament=${encodeURIComponent(tournament.tournament_type)}" class="btn ${index % 2 === 0 ? 'btn-primary' : 'btn-secondary'}" style="width: 100%; margin-top: 1rem;"><span data-i18n="landing.registerNow">S'inscrire maintenant</span></a>
        `}
      </article>
    `;
  }

  // ============================================
  // COUNTDOWN LOGIC
  // ============================================
  
  function updateCountdown(tournament, index) {
    if (!tournament.tournament_date) return;
    
    const now = new Date().getTime();
    const tournamentTime = new Date(tournament.tournament_date).getTime();
    const distance = tournamentTime - now;
    
    const container = document.getElementById(`countdown${index}Container`);
    
    if (distance < 0) {
      // Tournament has started or passed
      if (container) {
        container.style.display = 'none';
      }
      return;
    }
    
    // Show countdown container
    if (container) {
      container.style.display = 'block';
    }
    
    // Calculate time units
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    
    // Update display
    const daysEl = document.getElementById(`countdown${index}-days`);
    const hoursEl = document.getElementById(`countdown${index}-hours`);
    const minutesEl = document.getElementById(`countdown${index}-minutes`);
    const secondsEl = document.getElementById(`countdown${index}-seconds`);
    
    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  function formatDate(date, lang) {
    return date.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
  
  function showError() {
    const container = document.getElementById('tournamentsContainer');
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #f5f5f5; border-radius: 12px;">
          <p style="font-size: 3rem; margin-bottom: 1rem;">⚠️</p>
          <h3 style="color: #666;">Unable to load tournaments</h3>
          <p style="color: #666;">Please check your connection and try again.</p>
          <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 1rem;">Refresh</button>
        </div>
      `;
    }
  }
  
  function showNoTournaments() {
    const container = document.getElementById('tournamentsContainer');
    if (container) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #f5f5f5; border-radius: 12px;">
          <p style="font-size: 3rem; margin-bottom: 1rem;">🎮</p>
          <h3 style="color: #666;"><span data-i18n="landing.noTournaments">No tournaments available</span></h3>
          <p style="color: #666;"><span data-i18n="landing.checkBackSoon">Check back soon for upcoming tournaments!</span></p>
        </div>
      `;
    }
  }

})();
