// Bilingual Translation System for AFNOO Tournaments
// French (FR) is the default language

const translations = {
  fr: {
    // Header & Navigation
    header: {
      title: "Tournois et compétitions",
      subtitle: "Association des francophones du Nord-Ouest de l'Ontario",
      home: "Accueil",
      register: "S'inscrire",
      brackets: "Tableaux",
      results: "Résultats",
      admin: "Admin",
      langToggle: "EN" // Shows what language you'll switch TO
    },

    // Landing Page
    landing: {
      welcome: "Bienvenue à AFNOO - Tournois et compétitions!",
      tagline: "L'Association des francophones du Nord-Ouest de l'Ontario",
      intro: "Participez à nos tournois de Roblox, Kahoot, et plus encore! Rejoignez la compétition organisée par l'AFNOO.",
      
      // Tournament 1
      tournament1Title: "RIVALS",
      tournament1Subtitle: "13-18 ans",
      tournament1Desc: "Combat compétitif FPS sur Roblox",
      tournament1Format: "FFA / Élimination",
      
      // Tournament 2
      tournament2Title: "Ultimate Driving",
      tournament2Subtitle: "Tous âges",
      tournament2Desc: "Compétition de course rapide et excitante",
      tournament2Format: "Chronométré / Points",
      
      // Call to Action
      registerNow: "S'inscrire maintenant",
      signupClosed: "Inscriptions fermées",
      tournamentInProgress: "Tournoi en cours",
      tournamentCompleted: "Tournoi terminé",
      viewResults: "Voir les résultats",
      viewBrackets: "Voir les tableaux",
      joinTeams: "Rejoindre la réunion Teams",
      scanQR: "Scannez le code QR pour vous inscrire",
      
      // Info Sections
      dateLabel: "Date",
      timeLabel: "Heure",
      formatLabel: "Format",
      platformLabel: "Plateforme",
      prizeLabel: "Prix",
      
      // Countdown
      countdownTitle: "Temps avant le début du tournoi",
      countdownStarts: "Commence dans",
      days: "jours",
      hours: "heures",
      minutes: "minutes",
      seconds: "secondes",
      daysAbbrev: "j",
      hoursAbbrev: "h",
      minutesAbbrev: "m",
      secondsAbbrev: "s",
      noTournaments: "Aucun tournoi disponible",
      checkBackSoon: "Revenez bientôt pour les prochains tournois!",
      
      // Rules Section
      rulesTitle: "Règlement",
      rulesAge: "Confirmation d'âge requise",
      rulesConduct: "Conduite respectueuse obligatoire",
      rulesNoCheat: "Aucune triche ou exploit",
      rulesUsername: "Nom d'utilisateur valide uniquement (selon la plateforme)",
      
      // FAQ Section
      faqTitle: "Questions fréquentes",
      faq1Q: "Comment m'inscrire?",
      faq1A: "Cliquez sur « S'inscrire maintenant » et entrez votre nom d'utilisateur. Aucune information personnelle requise!",
      faq2Q: "Dois-je installer quelque chose?",
      faq2A: "Si vous vous inscrivez à un tournoi Roblox, vous devez avoir Roblox installé et un nom d'utilisateur Roblox valide. Tout le reste se fait dans votre navigateur.",
      faq3Q: "Comment suivre les résultats?",
      faq3A: "Les tableaux se mettent à jour en temps réel pendant le tournoi. Consultez simplement la page Tableaux!",
      faq4Q: "Que se passe-t-il si je ne peux pas participer?",
      faq4A: "Veuillez nous informer avant le tournoi si possible. Les absents seront disqualifiés après 5 minutes.",
      
      // Footer
      footerOrg: "Organisé par l'Association des francophones du Nord-Ouest de l'Ontario (AFNOO)",
      footerContact: "Contact",
      footerPrivacy: "Politique de confidentialité",
      footerAccessibility: "Accessibilité",
      footerCompliance: "Ce site est conforme aux Règles pour l'accessibilité des contenus Web (WCAG) 2.0.",
      footerCopyright: "© AFNOO, 2026 – Tous droits réservés.",
      footerFunding: "Financé par le gouvernement de l'Ontario"
    },

    // Signup Form
    signup: {
      title: "Inscription au tournoi",
      subtitle: "Rejoignez la compétition!",
      
      // Form Fields
      usernameLabel: "Nom d'utilisateur",
      usernamePlaceholder: "Entrez votre nom d'utilisateur",
      usernameHelp: "Assurez-vous que votre nom d'utilisateur est exact",
      
      tournamentLabel: "Sélectionnez un tournoi",
      tournament1Option: "RIVALS (13-18 ans)",
      tournament2Option: "Ultimate Driving (Tous âges)",
      
      ageConfirmLabel: "Je confirme que je respecte les exigences d'âge pour le tournoi sélectionné",
      rulesConfirmLabel: "J'accepte de suivre les règles du tournoi",
      rulesRequired: "Veuillez accepter les règles pour continuer",
      
      submitButton: "S'inscrire",
      submitting: "Inscription en cours...",
      
      // Validation Messages
      errorRequired: "Ce champ est obligatoire",
      errorInvalidUsername: "Nom d'utilisateur invalide",
      errorUserNotFound: "Nom d'utilisateur introuvable. Vérifiez l'orthographe!",
      errorAlreadyRegistered: "Vous êtes déjà inscrit à ce tournoi",
      errorSelectTournament: "Veuillez sélectionner un tournoi",
      errorAgeConfirm: "Vous devez confirmer votre âge",
      errorRulesConfirm: "Vous devez accepter les règles",
      errorServerError: "Erreur serveur. Veuillez réessayer.",
      
      // Success Page
      successTitle: "Inscription réussie!",
      successMessage: "Bienvenue au tournoi!",
      registrationNumber: "Numéro d'inscription",
      nextSteps: "Prochaines étapes",
      step1: "Rejoignez la réunion Teams le jour du tournoi",
      step2: "Consultez les tableaux pour voir votre position",
      step3: "Soyez prêt 15 minutes avant le début",
      shareTitle: "Partagez avec vos amis",
      shareQR: "Scannez ce code QR pour vous inscrire",
      addCalendar: "Ajouter au calendrier",
      backHome: "Retour à l'accueil",
      
      // Privacy Notice
      privacyTitle: "Confidentialité",
      privacyText: "Nous ne collectons que votre nom d'utilisateur Roblox (information publique). Aucune donnée personnelle n'est requise."
    },

    // Bracket/Live View
    bracket: {
      title: "Tableaux en direct",
      bracketTitle: "Bracket d'élimination",
      loading: "Chargement des tableaux...",
      lastUpdated: "Dernière mise à jour",
      liveUpdates: "Mises à jour en direct",
      
      // Tournament Info
      tournamentStatus: "Statut du tournoi",
      currentRound: "Ronde actuelle",
      nextMatch: "Prochain match dans",
      participant: "participant",
      participants: "participants",
      
      // Leaderboard
      rank: "Rang",
      rounds: "Rondes",
      points: "Points",
      tie: "ÉGALITÉ",
      viewRound: "Afficher :",
      overallStandings: "Classement général",
      round: "Ronde",
      
      // Empty State
      noParticipants: "Aucun participant inscrit",
      waitingToStart: "En attente du début du tournoi...",
      
      // Leaderboard
      leaderboardTitle: "Classement",
      rank: "Rang",
      totalPoints: "Points totaux",
      round: "Ronde",
      status: "Statut",
      
      // Statuses
      statusRegistration: "Inscription ouverte",
      statusUpcoming: "À venir",
      statusInProgress: "En cours",
      statusCompleted: "Terminé",
      statusUpcoming: "À venir",
      statusLive: "En direct",
      
      // Table Headers
      participant: "Participant",
      round: "Ronde",
      points: "Points",
      rank: "Rang",
      status: "Statut",
      score: "Score",
      
      // Round Names
      round1: "Ronde 1",
      round2: "Ronde 2",
      round3: "Ronde 3",
      semifinals: "Demi-finales",
      finals: "Finale",
      thirdPlace: "Match pour la 3e place",
      playIn: "Matchs de barrage",
      quarterFinals: "Quarts de finale",
      roundOf16: "Huitièmes de finale",
      roundOf32: "Trente-deuxièmes de finale",
      
      // Match Info
      matchNumber: "Match",
      winner: "Gagnant",
      vs: "contre",
      bye: "Exempt",
      tbd: "À venir",
      
      // Leaderboard
      leaderboardTitle: "Classement",
      totalPoints: "Points totaux",
      roundBreakdown: "Détails par ronde",
      topPlayers: "Meilleurs joueurs",
      
      // Empty States
      noParticipants: "Aucun participant inscrit",
      noMatches: "Aucun match prévu pour le moment",
      waitingToStart: "En attente du début du tournoi...",
      
      // Auto-refresh
      lastUpdated: "Dernière mise à jour",
      liveUpdates: "Mises à jour en direct",
      refreshing: "Actualisation...",
      
      // Teams Link
      teamsButton: "Rejoindre Teams",
      teamsInfo: "Cliquez ici pour rejoindre l'annonce vocale"
    },

    // Results Page
    results: {
      title: "Résultats du tournoi",
      finalStandings: "Classement final",
      fullStandings: "Classement complet",
      
      // No Results State
      upcomingTitle: "Tournoi en cours ou à venir",
      upcomingMessage: "Les résultats seront disponibles une fois le tournoi terminé.",
      
      // Podium
      firstPlace: "1ère place",
      secondPlace: "2e place",
      thirdPlace: "3e place",
      congratulations: "Félicitations!",
      winner: "Vainqueur",
      statusMadeElimination: "Élimination",
      statusDidNotMakeElimination: "Hors élimination",
      
      // Stats
      statsTitle: "Statistiques du tournoi",
      totalParticipants: "Participants totaux",
      totalMatches: "Matches joués",
      tournamentDuration: "Durée du tournoi",
      fastestTime: "Temps le plus rapide",
      highestScore: "Meilleur score",
      
      // Round Details
      roundByRound: "Détails par ronde",
      viewDetails: "Voir les détails",
      hideDetails: "Masquer les détails",
      
      // Download
      downloadCertificate: "Télécharger le certificat",
      shareResults: "Partager les résultats",
      
      // Thank You
      thankYou: "Merci d'avoir participé!",
      nextTournament: "Restez à l'écoute pour le prochain tournoi!",
      signupNext: "S'inscrire au prochain tournoi"
    },

    // Common/Shared
    common: {
      loading: "Chargement...",
      selectTournamentResults: "Choisissez le tournoi pour lequel vous voulez voir les résultats.",
      selectTournamentBracket: "Choisissez le tournoi dont vous voulez voir le tableau.",
      error: "Erreur",
      success: "Succès",
      warning: "Attention",
      info: "Information",
      close: "Fermer",
      cancel: "Annuler",
      confirm: "Confirmer",
      confirmed: "Confirmé",
      save: "Enregistrer",
      edit: "Modifier",
      delete: "Supprimer",
      back: "Retour",
      next: "Suivant",
      previous: "Précédent",
      search: "Rechercher",
      filter: "Filtrer",
      sort: "Trier",
      refresh: "Actualiser",
      yes: "Oui",
      no: "Non",
      optional: "Optionnel",
      required: "Obligatoire"
    }
  },

  en: {
    // Header & Navigation
    header: {
      title: "Tournaments & Competitions",
      subtitle: "Association des francophones du Nord-Ouest de l'Ontario",
      home: "Home",
      register: "Register",
      brackets: "Brackets",
      results: "Results",
      admin: "Admin",
      langToggle: "FR" // Shows what language you'll switch TO
    },

    // Landing Page
    landing: {
      welcome: "Welcome to AFNOO - Tournaments & Competitions!",
      tagline: "The Association of Francophones of Northwestern Ontario",
      intro: "Participate in our Roblox, Kahoot tournaments, and more! Join the competition organized by AFNOO.",
      
      // Tournament 1
      tournament1Title: "RIVALS",
      tournament1Subtitle: "Ages 13-18",
      tournament1Desc: "Competitive FPS combat on Roblox",
      tournament1Format: "FFA / Elimination",
      
      // Tournament 2
      tournament2Title: "Ultimate Driving",
      tournament2Subtitle: "All Ages",
      tournament2Desc: "Fast-paced and exciting racing competition",
      tournament2Format: "Timed / Points",
      
      // Call to Action
      registerNow: "Register Now",
      signupClosed: "Signups Closed",
      tournamentInProgress: "Tournament in Progress",
      tournamentCompleted: "Tournament Completed",
      viewResults: "View Results",
      viewBrackets: "View Brackets",
      joinTeams: "Join Teams Meeting",
      scanQR: "Scan QR code to register",
      
      // Info Sections
      dateLabel: "Date",
      timeLabel: "Time",
      formatLabel: "Format",
      platformLabel: "Platform",
      prizeLabel: "Prizes",
      
      // Countdown
      countdownTitle: "Time Until Tournament Starts",
      countdownStarts: "Starts in",
      days: "days",
      hours: "hours",
      minutes: "minutes",
      seconds: "seconds",
      daysAbbrev: "d",
      hoursAbbrev: "h",
      minutesAbbrev: "m",
      secondsAbbrev: "s",
      noTournaments: "No tournaments available",
      checkBackSoon: "Check back soon for upcoming tournaments!",
      
      // Rules Section
      rulesTitle: "Rules",
      rulesAge: "Age confirmation required",
      rulesConduct: "Respectful conduct mandatory",
      rulesNoCheat: "No cheating or exploits",
      rulesUsername: "Valid username only (for the tournament platform)",
      
      // FAQ Section
      faqTitle: "Frequently Asked Questions",
      faq1Q: "How do I register?",
      faq1A: "Click 'Register Now' and enter your username. No personal information required!",
      faq2Q: "Do I need to install anything?",
      faq2A: "If you are joining a Roblox tournament, you need to have Roblox installed and a valid Roblox username. Everything else is done through your browser.",
      faq3Q: "How do I follow the results?",
      faq3A: "Brackets update in real-time during the tournament. Just check the Brackets page!",
      faq4Q: "What if I can't participate?",
      faq4A: "Please let us know before the tournament if possible. No-shows will be disqualified after 5 minutes.",
      
      // Footer
      footerOrg: "Organized by the Association des francophones du Nord-Ouest de l'Ontario (AFNOO)",
      footerContact: "Contact",
      footerPrivacy: "Privacy Policy",
      footerAccessibility: "Accessibility",
      footerCompliance: "This site is compliant with Web Content Accessibility Guidelines (WCAG) 2.0.",
      footerCopyright: "© AFNOO, 2026 – All rights reserved.",
      footerFunding: "Funded by the Government of Ontario"
    },

    // Signup Form
    signup: {
      title: "Tournament Registration",
      subtitle: "Join the competition!",
      
      // Form Fields
      usernameLabel: "Username",
      usernamePlaceholder: "Enter your username",
      usernameHelp: "Make sure your username is correct",
      
      tournamentLabel: "Select a tournament",
      tournament1Option: "RIVALS (Ages 13-18)",
      tournament2Option: "Ultimate Driving (All Ages)",
      
      ageConfirmLabel: "I confirm that I meet the age requirements for the selected tournament",
      rulesConfirmLabel: "I agree to follow the tournament rules",
      rulesRequired: "Please accept the rules to proceed",
      
      submitButton: "Register",
      submitting: "Registering...",
      
      // Validation Messages
      errorRequired: "This field is required",
      errorInvalidUsername: "Invalid username",
      errorUserNotFound: "Username not found. Check your spelling!",
      errorAlreadyRegistered: "You are already registered for this tournament",
      errorSelectTournament: "Please select a tournament",
      errorAgeConfirm: "You must confirm your age",
      errorRulesConfirm: "You must accept the rules",
      errorServerError: "Server error. Please try again.",
      
      // Success Page
      successTitle: "Registration Successful!",
      successMessage: "Welcome to the tournament!",
      registrationNumber: "Registration Number",
      nextSteps: "Next Steps",
      step1: "Join the Teams meeting on tournament day",
      step2: "Check the brackets to see your position",
      step3: "Be ready 15 minutes before start time",
      shareTitle: "Share with friends",
      shareQR: "Scan this QR code to register",
      addCalendar: "Add to Calendar",
      backHome: "Back to Home",
      
      // Privacy Notice
      privacyTitle: "Privacy",
      privacyText: "We only collect your username (public information). No personal data is required."
    },

    // Bracket/Live View
    bracket: {
      title: "Live Brackets",
      bracketTitle: "Elimination Bracket",
      loading: "Loading brackets...",
      lastUpdated: "Last updated",
      liveUpdates: "Live updates",
      
      // Tournament Info
      tournamentStatus: "Tournament Status",
      currentRound: "Current Round",
      nextMatch: "Next match in",
      participant: "participant",
      participants: "participants",
      
      // Leaderboard
      rank: "Rank",
      rounds: "Rounds",
      points: "Points",
      tie: "TIE",
      viewRound: "View:",
      overallStandings: "Overall Standings",
      round: "Round",
      
      // Empty State
      noParticipants: "No participants registered",
      waitingToStart: "Waiting for tournament to start...",
      
      // Leaderboard
      leaderboardTitle: "Leaderboard",
      rank: "Rank",
      totalPoints: "Total Points",
      round: "Round",
      status: "Status",
      
      // Statuses
      statusRegistration: "Registration Open",
      statusUpcoming: "Upcoming",
      statusInProgress: "In Progress",
      statusCompleted: "Completed",
      statusUpcoming: "Upcoming",
      statusLive: "Live",
      
      // Table Headers
      participant: "Participant",
      round: "Round",
      points: "Points",
      rank: "Rank",
      status: "Status",
      score: "Score",
      
      // Round Names
      round1: "Round 1",
      round2: "Round 2",
      round3: "Round 3",
      semifinals: "Semi-Finals",
      finals: "Finals",
      thirdPlace: "3rd Place",
      playIn: "Play-in",
      quarterFinals: "Quarter-Finals",
      roundOf16: "Round of 16",
      roundOf32: "Round of 32",
      
      // Match Info
      matchNumber: "Match",
      winner: "Winner",
      vs: "vs",
      bye: "Bye",
      tbd: "TBD",
      
      // Leaderboard
      leaderboardTitle: "Leaderboard",
      totalPoints: "Total Points",
      roundBreakdown: "Round Breakdown",
      topPlayers: "Top Players",
      
      // Empty States
      noParticipants: "No participants registered",
      noMatches: "No matches scheduled yet",
      waitingToStart: "Waiting for tournament to start...",
      
      // Auto-refresh
      lastUpdated: "Last updated",
      liveUpdates: "Live updates",
      refreshing: "Refreshing...",
      
      // Teams Link
      teamsButton: "Join Teams",
      teamsInfo: "Click here to join the voice announcement"
    },

    // Results Page
    results: {
      title: "Tournament Results",
      finalStandings: "Final Standings",
      fullStandings: "Full Standings",
      
      // No Results State
      upcomingTitle: "Tournament in progress or upcoming",
      upcomingMessage: "Results will be available once the tournament is complete.",
      
      // Podium
      firstPlace: "1st Place",
      secondPlace: "2nd Place",
      thirdPlace: "3rd Place",
      congratulations: "Congratulations!",
      winner: "Winner",
      statusMadeElimination: "Made elimination",
      statusDidNotMakeElimination: "Did not make elimination",
      
      // Stats
      statsTitle: "Tournament Statistics",
      totalParticipants: "Total Participants",
      totalMatches: "Matches Played",
      tournamentDuration: "Tournament Duration",
      fastestTime: "Fastest Time",
      highestScore: "Highest Score",
      
      // Round Details
      roundByRound: "Round by Round",
      viewDetails: "View Details",
      hideDetails: "Hide Details",
      
      // Download
      downloadCertificate: "Download Certificate",
      shareResults: "Share Results",
      
      // Thank You
      thankYou: "Thank you for participating!",
      nextTournament: "Stay tuned for the next tournament!",
      signupNext: "Sign up for next tournament"
    },

    // Common/Shared
    common: {
      loading: "Loading...",
      selectTournamentResults: "Select which tournament you want to see results for.",
      selectTournamentBracket: "Select which tournament you want to see the bracket for.",
      error: "Error",
      success: "Success",
      warning: "Warning",
      info: "Information",
      close: "Close",
      cancel: "Cancel",
      confirm: "Confirm",
      confirmed: "Confirmed",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      back: "Back",
      next: "Next",
      previous: "Previous",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      refresh: "Refresh",
      yes: "Yes",
      no: "No",
      optional: "Optional",
      required: "Required"
    }
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = translations;
}
