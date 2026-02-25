// Bilingual Translation System for AFNOO Tournaments
// French (FR) is the default language

const translations = {
  fr: {
    devBanner: "Ce site est en développement. Les données ne seront pas conservées. Le site peut changer. Veuillez ne pas vous inscrire.",
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
      moreInfo: "Plus d'infos",
      registerNow: "S'inscrire maintenant",
      signupClosed: "Inscriptions fermées",
      tournamentInProgress: "Tournoi en cours",
      tournamentCompleted: "Tournoi terminé",
      viewResults: "Voir les résultats",
      viewBrackets: "Voir les tableaux",
      joinTeams: "Rejoindre la réunion Google Meet",
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

    // Tournament Info Page (More Info)
    tournamentInfo: {
      pageTitle: "Infos tournoi - AFNOO",
      noTournament: "Tournoi",
      selectFromHome: "Choisissez un tournoi depuis l'accueil pour voir ses infos.",
      moreInfoSoon: "Plus d'infos à venir pour ce tournoi.",
      rivalsSubtitle: "13–18 ans • FFA puis élimination directe",
      format: "Format",
      phaseFFA: "Phase FFA (Free-For-All)",
      ffaPointsIntro: "Points par place à l'arrivée (par ronde) :",
      ffaPointsScale: "1er : 100 pts\n2e : 90 pts\n3e : 80 pts\n4e : 70 pts\n5e : 60 pts\n6e : 50 pts\n7e : 40 pts\n8e : 30 pts\n9e : 20 pts\n10e : 5 pts\n11e et + : 0 pt",
      ffaRounds: "3 rondes FFA de 8 minutes chacune.",
      ffaTop10: "Pour être qualifié : top 10 au classement FFA et au moins 1 élimination sur les 3 rondes.",
      playIn: "Phase de barrage (play-in): 4 joueurs du top 10 s'affrontent en 1v1 pour une place en tableau.",
      howItWorks: "Comment ça se passe",
      ffaFlowTitle: "Phase FFA – Déroulement d'une ronde",
      ffaFlow1: "Une fois tous les joueurs du groupe dans le lobby (zone de départ), le tournoi démarre et tout le monde est téléporté dans l'arène.",
      ffaFlow2: "Vote de carte : les joueurs votent pour la carte avant le début de la partie.",
      ffaFlow3: "Loadout : une fois la carte choisie, vous avez 15 secondes pour configurer votre équipement (armes autorisées uniquement). La partie démarre immédiatement après – choisissez vite pour ne pas manquer de points !",
      elimFlowTitle: "Phase 1v1 – Élimination directe",
      elimFlow1: "Les matchs sont déterminés par le tableau (visible sur la page Tableaux). Quand c'est votre tour, l'animateur vous appellera.",
      elimFlow2: "Les 2 joueurs doivent se placer sur les plateformes de duel dans le lobby pour lancer le 1v1.",
      elimFlow3: "Comme en FFA : vote de carte, puis 15 secondes pour choisir votre loadout.",
      elimFlow4: "Format : 5 rondes, premier à gagner 5 rondes remporte le match. Chaque ronde = 1 élimination pour gagner (première élimination de la ronde). Rondes de 1 min 30 s. Si aucune élimination → gagnant tiré au sort.",
      elimFlow5: "Il y a un match pour la 3e place entre les 2 perdants des demi-finales.",
      phaseElim: "Phase à élimination directe",
      elimDesc: "Tableau 1v1 à élimination directe jusqu'à la finale et le match pour la 3e place.",
      capacity: "Places et groupes",
      capacityText: "Maximum 76 joueurs: 2 groupes de 38 + 4 spectateurs.",
      howToJoin: "Comment participer",
      joinSteps: "Inscrivez-vous sur ce site, puis rejoignez le serveur privé Roblox du tournoi le jour J avec le lien ci-dessous.",
      joinServerLink: "Rejoindre le serveur privé RIVALS du tournoi →",
      orScanQR: "Ou scannez ce code QR avec l'appareil que vous utiliserez pendant le tournoi :",
      joinMeetLink: "Rejoindre la réunion Google Meet pour les annonces vocales (jour du tournoi) →",
      rules: "Règles du jeu",
      mapsRandom: "Les cartes sont votées par les joueurs avant le début du jeu.",
      weaponsOnly: "Seules les armes/équipements suivants sont autorisés. Toute autre arme ou équipement est interdite et peut entraîner une disqualification.",
      primary: "Arme principale",
      secondary: "Secondaire",
      melee: "Mêlée",
      utility: "Utility",
      practice: "S'entraîner",
      practiceText: "Jouez à RIVALS sur Roblox pour vous familiariser avec le jeu.",
      registerForTournament: "S'inscrire à ce tournoi",
      registrationClosed: "Tournoi complet – Inscriptions fermées",
      backToHome: "Retour à l'accueil",
      hideSubtitle: "",
      hideFormat: "Pour s'amuser!",
      hideOneSeeker: "Il y a des chercheurs et des cachés.",
      hideSeekerRandom: "Le chercheur est choisi au hasard.",
      hideOneMin: "Au début, vous avez 1 minute pour vous CACHER!",
      hideWin: "Restez caché jusqu'à la fin de la manche – si vous n'êtes pas attrapé, vous gagnez!",
      hideSeekerJob: "Si vous êtes le chercheur, trouvez et attrapez tout le monde dans le lobby.",
      hideRoundLength: "Chaque manche dure 6 minutes.",
      hideCapacity: "Le serveur peut accueillir 98 joueurs + 2 spectateurs. Il y aura 1 chercheur pour 25 cachés.",
      hideServerLink: "Rejoindre le serveur privé Hide and Seek →",
      hidePlayGame: "Jouer au jeu",
      hideRules: "Pas de règles, amusez-vous!"
    },

    // Signup Form
    signup: {
      title: "Inscription au tournoi",
      subtitle: "Rejoignez la compétition!",
      
      // Form Fields
      usernameLabel: "Nom d'utilisateur",
      usernamePlaceholder: "Entrez votre nom d'utilisateur",
      usernameHelp: "Assurez-vous que votre nom d'utilisateur est exact",
      
      emailLabel: "Courriel (optionnel)",
      emailPlaceholder: "votre@courriel.com",
      emailHelp: "Pour les mises à jour du tournoi. Non affiché publiquement.",
      
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
      step1: "Rejoignez la réunion Google Meet le jour du tournoi – le lien est sur la page « Plus d'infos »",
      step2: "Consultez les tableaux pour voir votre position",
      step3: "Soyez prêt 15 minutes avant le début",
      shareTitle: "Partagez avec vos amis",
      shareQR: "Scannez ce code QR pour vous inscrire",
      addCalendar: "Ajouter au calendrier",
      backHome: "Retour à l'accueil",
      robloxDownloadIntro: "L'application Roblox est requise. Téléchargez-la ici :",
      
      // Privacy Notice
      privacyTitle: "Confidentialité",
      privacyText: "Nous ne collectons que votre nom d'utilisateur (information publique). Le courriel est optionnel et stocké de façon privée, inaccessible au site."
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
      group: "Groupe",
      allGroups: "Tous les groupes",
      rankInGroup: "Rang dans le groupe",
      ranksInGroupNote: "Les rangs affichés sont ceux du groupe sélectionné.",
      
      // Empty State
      noParticipants: "Aucun participant inscrit",
      waitingToStart: "En attente du début du tournoi...",
      registrationClosedEmpty: "Inscriptions fermées.",
      
      // Leaderboard
      leaderboardTitle: "Classement",
      rank: "Rang",
      totalPoints: "Points totaux",
      round: "Ronde",
      status: "Statut",
      
      // Statuses
      statusRegistration: "Inscription ouverte",
      statusAtCapacity: "Inscription complète",
      statusUpcoming: "À venir",
      statusInProgress: "En cours",
      statusCompleted: "Terminé",
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
      
      // Google Meet Link
      teamsButton: "Rejoindre Google Meet",
      teamsInfo: "Cliquez ici pour rejoindre l'annonce vocale"
    },

    // Results Page
    results: {
      title: "Résultats du tournoi",
      finalStandings: "Classement final",
      fullStandings: "Classement complet",
      
      // No Results State
      noTournamentsTitle: "Aucun tournoi avec des résultats",
      noTournamentsMessage: "Aucun tournoi terminé n'a de résultats pour le moment. Revenez plus tard ou consultez les tableaux pour suivre les tournois en cours.",
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
    devBanner: "This website is in development. Data will not be kept. Site is subject to change. Please do not register.",
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
      moreInfo: "More Info",
      registerNow: "Register Now",
      signupClosed: "Signups Closed",
      tournamentInProgress: "Tournament in Progress",
      tournamentCompleted: "Tournament Completed",
      viewResults: "View Results",
      viewBrackets: "View Brackets",
      joinTeams: "Join Google Meet",
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

    // Tournament Info Page (More Info)
    tournamentInfo: {
      pageTitle: "Tournament Info - AFNOO",
      noTournament: "Tournament",
      selectFromHome: "Choose a tournament from the home page to see its details.",
      moreInfoSoon: "More info coming soon for this tournament.",
      rivalsSubtitle: "Ages 13–18 • FFA then single elimination",
      format: "Format",
      phaseFFA: "FFA (Free-For-All) phase",
      ffaPointsIntro: "Points per placement (per round):",
      ffaPointsScale: "1st : 100 pts\n2nd : 90 pts\n3rd : 80 pts\n4th : 70 pts\n5th : 60 pts\n6th : 50 pts\n7th : 40 pts\n8th : 30 pts\n9th : 20 pts\n10th : 5 pts\n11th and below : 0 pts",
      ffaRounds: "3 FFA rounds, 8 minutes each.",
      ffaTop10: "To qualify: top 10 in FFA standings and at least 1 elimination across the 3 rounds.",
      playIn: "Play-in: 4 players from the top 10 compete in 1v1 for one spot in the bracket.",
      howItWorks: "How it works",
      ffaFlowTitle: "FFA Phase – Round flow",
      ffaFlow1: "Once all players in the group are in the lobby (starting area), the tournament starts and everyone is teleported to the arena.",
      ffaFlow2: "Map vote: players vote for the map before the game starts.",
      ffaFlow3: "Loadout: once the map is chosen, you have 15 seconds to set up your equipment (authorized weapons only). The game starts immediately after – choose quickly so you don't miss out on points!",
      elimFlowTitle: "1v1 Phase – Elimination bracket",
      elimFlow1: "Matchups are determined by the bracket (visible on the Brackets page). When it's your turn, the host will call you.",
      elimFlow2: "Both players must stand on the duel platforms in the lobby to start the 1v1.",
      elimFlow3: "Same as FFA: map vote, then 15 seconds to choose your loadout.",
      elimFlow4: "Format: 5 rounds, first to win 5 rounds wins the match. Each round = 1 elimination to win (first elimination of the round). Rounds last 1 min 30 s. If no elimination → winner decided at random.",
      elimFlow5: "There is a 3rd place match between the 2 semi-final losers.",
      phaseElim: "Elimination phase",
      elimDesc: "Single-elimination 1v1 bracket until the 3rd-place match and finals.",
      capacity: "Capacity and groups",
      capacityText: "Maximum 76 players: 2 groups of 38 + 4 spectators.",
      howToJoin: "How to join",
      joinSteps: "Register on this site, then join the tournament's private Roblox server on the day using the link below.",
      joinServerLink: "Join the Tournaments Private RIVALS Server →",
      orScanQR: "Or scan this QR code using the device you want to use during the tournament:",
      joinMeetLink: "Join the Google Meet for voice announcements (tournament day) →",
      rules: "Game rules",
      mapsRandom: "Maps are voted on by players before game start.",
      weaponsOnly: "Only the following weapons/equipment are allowed. Using anything else may result in disqualification.",
      primary: "Primary",
      secondary: "Secondary",
      melee: "Melee",
      utility: "Utility",
      practice: "Practice",
      practiceText: "Play RIVALS on Roblox to get familiar with the game.",
      registerForTournament: "Register for this tournament",
      registrationClosed: "Tournament full – Registration closed",
      backToHome: "Back to home",
      hideSubtitle: "",
      hideFormat: "For fun!",
      hideOneSeeker: "There are seekers and hiders.",
      hideSeekerRandom: "The seeker is chosen at random.",
      hideOneMin: "At the start, you have 1 minute to HIDE!",
      hideWin: "Hide until the round ends – if you don't get tagged, you win!",
      hideSeekerJob: "If you're the seeker, find and tag everyone in the lobby.",
      hideRoundLength: "Each round lasts 6 minutes.",
      hideCapacity: "The server can hold 98 players + 2 spectators. There will be 1 seeker per 25 hiders.",
      hideServerLink: "Join the Hide and Seek private server →",
      hidePlayGame: "Play the game",
      hideRules: "No rules, just have fun!"
    },

    // Signup Form
    signup: {
      title: "Tournament Registration",
      subtitle: "Join the competition!",
      
      // Form Fields
      usernameLabel: "Username",
      usernamePlaceholder: "Enter your username",
      usernameHelp: "Make sure your username is correct",
      
      emailLabel: "Email (optional)",
      emailPlaceholder: "your@email.com",
      emailHelp: "For tournament updates. Not displayed publicly.",
      
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
      step1: "Join the Google Meet on tournament day – the link is on the More info page",
      step2: "Check the brackets to see your position",
      step3: "Be ready 15 minutes before start time",
      shareTitle: "Share with friends",
      shareQR: "Scan this QR code to register",
      addCalendar: "Add to Calendar",
      backHome: "Back to Home",
      robloxDownloadIntro: "The Roblox app is required. Please download it here:",
      
      // Privacy Notice
      privacyTitle: "Privacy",
      privacyText: "We only collect your username (public information). Email is optional and stored privately, inaccessible to the website."
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
      group: "Group",
      allGroups: "All groups",
      rankInGroup: "Rank in group",
      ranksInGroupNote: "Ranks shown are within the selected group.",
      
      // Empty State
      noParticipants: "No participants registered",
      waitingToStart: "Waiting for tournament to start...",
      registrationClosedEmpty: "Registration closed.",
      
      // Leaderboard
      leaderboardTitle: "Leaderboard",
      rank: "Rank",
      totalPoints: "Total Points",
      round: "Round",
      status: "Status",
      
      // Statuses
      statusRegistration: "Registration Open",
      statusAtCapacity: "Tournament at capacity",
      statusUpcoming: "Upcoming",
      statusInProgress: "In Progress",
      statusCompleted: "Completed",
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
      
      // Google Meet Link
      teamsButton: "Join Google Meet",
      teamsInfo: "Click here to join the voice announcement"
    },

    // Results Page
    results: {
      title: "Tournament Results",
      finalStandings: "Final Standings",
      fullStandings: "Full Standings",
      
      // No Results State
      noTournamentsTitle: "No tournaments with results",
      noTournamentsMessage: "No completed tournaments have results yet. Check back later or view the brackets to follow tournaments in progress.",
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
