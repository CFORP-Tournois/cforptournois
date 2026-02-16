// Tournament Info Page – show detailed info per tournament (e.g. RIVALS / pvp)

(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  async function fetchTournamentStatus(tournamentType) {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) return null;
    try {
      const { data } = await window.supabaseConfig.supabase
        .from('tournaments')
        .select('status')
        .eq('tournament_type', tournamentType)
        .maybeSingle();
      return data ? data.status : null;
    } catch (e) {
      return null;
    }
  }

  function showRegistrationClosedIfNeeded(status) {
    const banner = document.getElementById('registrationClosedBanner');
    const text = document.getElementById('registrationClosedText');
    if (!banner || !text) return;
    if (status === 'in-progress' || status === 'at_capacity') {
      banner.style.display = 'block';
      banner.className = 'registration-closed-banner ' + (status === 'at_capacity' ? 'at-capacity' : 'in-progress');
      text.textContent = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.registrationClosed') : 'Tournament full – Registration closed';
    } else {
      banner.style.display = 'none';
    }
  }

  function setRivalsRegisterVisibility(status) {
    const block = document.querySelector('#rivalsContent .btn-register-block');
    if (!block) return;
    if (status === 'in-progress' || status === 'at_capacity') {
      block.style.display = 'none';
    } else {
      block.style.display = 'block';
    }
  }

  function setHideRegisterVisibility(status) {
    const block = document.querySelector('#hideContent .btn-register-block');
    if (!block) return;
    if (status === 'in-progress' || status === 'at_capacity') {
      block.style.display = 'none';
    } else {
      block.style.display = 'block';
    }
  }

  function stripHeartFromName(name) {
    if (!name || typeof name !== 'string') return name;
    return name.replace(/^\s*\[💘\]\s*/i, '').replace(/^\s*\[❤️?\]\s*/i, '').trim() || name;
  }

  async function fetchTournamentDisplayInfo(tournamentTypeRaw) {
    if (!window.supabaseConfig || !window.supabaseConfig.isSupabaseConfigured()) return null;
    try {
      const { data } = await window.supabaseConfig.supabase
        .from('tournaments')
        .select('name_fr, name_en, status')
        .eq('tournament_type', tournamentTypeRaw)
        .maybeSingle();
      return data;
    } catch (e) {
      return null;
    }
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const rawTournament = (params.get('tournament') || '').trim();
    const tournamentTypeLower = rawTournament.toLowerCase();
    const isRivals = tournamentTypeLower === 'pvp' || tournamentTypeLower.startsWith('rivals');
    const isHideAndSeek = tournamentTypeLower === 'hide-and-seek' || tournamentTypeLower.startsWith('hide');
    const rivalsContent = document.getElementById('rivalsContent');
    const hideContent = document.getElementById('hideContent');
    const genericInfo = document.getElementById('genericInfo');
    const tournamentTitle = document.getElementById('tournamentTitle');
    const tournamentSubtitle = document.getElementById('tournamentSubtitle');
    const hero = document.getElementById('tournamentHero');
    const heroLogo = document.getElementById('tournamentHeroLogo');

    if (isHideAndSeek) {
      if (rivalsContent) rivalsContent.style.display = 'none';
      if (hideContent) hideContent.style.display = 'block';
      genericInfo.style.display = 'none';
      if (hero) hero.classList.add('hero-with-logo');
      if (heroLogo) {
        heroLogo.src = 'assets/images/Hide/Hidelogo.png';
        heroLogo.alt = 'Hide and Seek';
        heroLogo.classList.remove('hidden');
      }
      var displayName = 'Hide and Seek';
      if (rawTournament && window.supabaseConfig && window.supabaseConfig.isSupabaseConfigured()) {
        var info = await fetchTournamentDisplayInfo(rawTournament);
        if (info) {
          var lang = window.i18n ? window.i18n.currentLang : 'fr';
          displayName = stripHeartFromName(lang === 'fr' ? (info.name_fr || info.name_en || 'Hide and Seek') : (info.name_en || info.name_fr || 'Hide and Seek'));
        }
      }
      tournamentTitle.textContent = displayName;
      tournamentSubtitle.textContent = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.hideSubtitle') : 'Pour s\'amuser!';
      document.title = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.pageTitle') + ' – ' + displayName : 'Infos tournoi – ' + displayName + ' - AFNOO';
      var status = await fetchTournamentStatus(rawTournament);
      showRegistrationClosedIfNeeded(status);
      setHideRegisterVisibility(status);
      var registerLink = document.querySelector('#hideContent .btn-register-block a');
      if (registerLink) registerLink.href = 'signup.html?tournament=' + encodeURIComponent(rawTournament);
      if (window.i18n && window.i18n.updateAllText) window.i18n.updateAllText();
      return;
    }

    if (isRivals) {
      if (hideContent) hideContent.style.display = 'none';
      rivalsContent.style.display = 'block';
      genericInfo.style.display = 'none';
      if (hero) hero.classList.add('hero-with-logo');
      if (heroLogo) {
        heroLogo.src = 'assets/images/Rivals/Rivals-Logo.png';
        heroLogo.alt = 'RIVALS';
        heroLogo.classList.remove('hidden');
      }
      var displayName = 'RIVALS';
      if (rawTournament && window.supabaseConfig && window.supabaseConfig.isSupabaseConfigured()) {
        var info = await fetchTournamentDisplayInfo(rawTournament);
        if (info) {
          var lang = window.i18n ? window.i18n.currentLang : 'fr';
          displayName = stripHeartFromName(lang === 'fr' ? (info.name_fr || info.name_en || 'RIVALS') : (info.name_en || info.name_fr || 'RIVALS'));
        }
      }
      tournamentTitle.textContent = displayName;
      tournamentSubtitle.textContent = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.rivalsSubtitle') : '13–18 ans • FFA puis élimination directe';
      document.title = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.pageTitle') + ' – ' + displayName : 'Infos tournoi – ' + displayName + ' - AFNOO';
      var status = await fetchTournamentStatus(rawTournament);
      showRegistrationClosedIfNeeded(status);
      setRivalsRegisterVisibility(status);
      var registerLink = document.querySelector('#rivalsContent .btn-register-block a');
      if (registerLink) registerLink.href = 'signup.html?tournament=' + encodeURIComponent(rawTournament);
      if (window.i18n && window.i18n.updateAllText) window.i18n.updateAllText();
      return;
    }

    if (rivalsContent) rivalsContent.style.display = 'none';
    if (hideContent) hideContent.style.display = 'none';
    genericInfo.style.display = 'block';
    if (hero) hero.classList.remove('hero-with-logo');
    if (heroLogo) heroLogo.classList.add('hidden');
    const genericMessage = document.getElementById('genericMessage');
    const genericSignupLink = document.getElementById('genericSignupLink');

    if (!rawTournament) {
      tournamentTitle.textContent = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.noTournament') : 'Tournoi';
      tournamentSubtitle.textContent = '';
      genericMessage.textContent = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.selectFromHome') : 'Choisissez un tournoi depuis l’accueil pour voir ses infos.';
      genericSignupLink.href = 'signup.html';
      genericSignupLink.style.display = 'none';
      document.title = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.pageTitle') : 'Infos tournoi - AFNOO';
    } else {
      var name = rawTournament;
      var status = null;
      var info = await fetchTournamentDisplayInfo(rawTournament);
      if (info) {
        var lang = window.i18n ? window.i18n.currentLang : 'fr';
        name = stripHeartFromName(lang === 'fr' ? (info.name_fr || info.name_en || rawTournament) : (info.name_en || info.name_fr || rawTournament));
        status = info.status;
      }
      tournamentTitle.textContent = name;
      tournamentSubtitle.textContent = '';
      genericMessage.textContent = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.moreInfoSoon') : 'Plus d’infos à venir pour ce tournoi.';
      showRegistrationClosedIfNeeded(status);
      if (status === 'in-progress' || status === 'at_capacity') {
        genericSignupLink.style.display = 'none';
      } else {
        genericSignupLink.href = 'signup.html?tournament=' + encodeURIComponent(rawTournament);
        genericSignupLink.style.display = 'inline-block';
      }
      document.title = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.pageTitle') + ' – ' + name : 'Infos tournoi – ' + name + ' - AFNOO';
    }

    if (window.i18n && window.i18n.updateAllText) window.i18n.updateAllText();
  }

  window.addEventListener('languageChanged', function() {
    const params = new URLSearchParams(window.location.search);
    const tournamentTypeLower = (params.get('tournament') || '').trim().toLowerCase();
    const isRivals = tournamentTypeLower === 'pvp' || tournamentTypeLower.startsWith('rivals');
    const isHideAndSeek = tournamentTypeLower === 'hide-and-seek' || tournamentTypeLower.startsWith('hide');
    const tournamentSubtitle = document.getElementById('tournamentSubtitle');
    if (tournamentSubtitle) {
      if (isRivals) tournamentSubtitle.textContent = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.rivalsSubtitle') : '13–18 ans • FFA puis élimination directe';
      else if (isHideAndSeek) tournamentSubtitle.textContent = (window.i18n && window.i18n.t) ? window.i18n.t('tournamentInfo.hideSubtitle') : 'Pour s\'amuser!';
    }
    if (window.i18n && window.i18n.updateAllText) window.i18n.updateAllText();
  });
})();
