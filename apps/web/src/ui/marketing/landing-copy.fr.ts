import type { LandingCopy } from './landing-copy.types';

export const landingCopyFr = {
  accessibility: {
    skipToContent: 'Aller au contenu',
    logoHome: 'Accueil Zedos',
  },
  navigation: {
    primaryLabel: 'Navigation principale',
    howItWorks: 'Comment ça marche',
    whyZedos: 'Pourquoi Zedos',
    earlyAccess: 'Accès anticipé',
    earlyAccessMobile: 'Accès pilote',
    apply: 'Demander un accès anticipé',
    existingPilot: 'Déjà pilote ? Se connecter',
    switchLanguage: 'Afficher le site en anglais',
  },
  hero: {
    eyebrow: 'Pilote privé · Conçu pour le bien-être',
    titleStart: 'Votre site et votre parcours de réservation. ',
    titleEmphasis: 'Conçus pour évoluer',
    titleEnd: ' avec votre studio.',
    mobileBody:
      'Site, réservation et futures fonctions sur une base flexible — sans renoncer à votre code ni à vos données.',
    desktopBody:
      'Zedos réunit votre site, votre parcours de réservation et vos futures fonctions sur une base flexible — sans renoncer à votre code, à vos données ni au développeur de votre choix.',
    primaryCta: 'Demander un accès anticipé',
    secondaryCta: 'Voir comment ça marche',
    trustPoints: [
      'Accompagnement direct par le fondateur',
      'Sans engagement',
      'Votre code et vos données restent à vous',
      'Aucune compétence technique requise',
    ],
    preview: {
      caption: 'Concept produit illustratif',
      studioName: 'Studio Juniper · Paris 11',
      headlineFirst: 'Bougez mieux.',
      headlineSecond: 'Gagnez en force.',
      description:
        'Pilates Reformer en petits groupes, avec un accompagnement attentif pour chaque corps.',
      findClass: 'Trouver un cours',
      date: 'Samedi 18 juillet',
      chooseClass: 'Choisissez votre cours',
      slots: [
        { time: '09:00', title: 'Reformer dynamique', detail: 'Maya · 3 places' },
        {
          time: '10:30',
          title: 'Fondamentaux',
          detail: 'Ana · 5 places',
          selected: true,
        },
        {
          time: '12:00',
          title: 'Reformer intense',
          detail: 'Maya · Liste d’attente',
        },
      ],
      continueWith: 'Continuer avec Fondamentaux',
      workshopReady: 'Atelier du week-end prêt',
      workshopDetail:
        'La page, les informations de réservation et le message de confirmation attendent votre validation.',
    },
  },
  problem: {
    eyebrow: 'Un seul parcours client. Trop d’outils.',
    title: 'Vos clients ressentent chaque rupture entre vos outils.',
    body:
      'Ils vous découvrent sur un site, réservent sur un autre, paient via un troisième et reçoivent leurs rappels ailleurs. Vous gérez chaque raccord — et dépendez d’un plugin, d’un prestataire ou d’une agence dès que l’activité change.',
    stack: [
      {
        title: 'Site web',
        description: 'À votre image',
        friction: 'Le parcours s’arrête au lien de réservation',
      },
      {
        title: 'Plateforme de réservation',
        description: 'Impose son propre parcours',
        friction: 'Votre expérience se plie à son modèle',
      },
      {
        title: 'Paiements et rappels',
        description: 'Ajoutent encore d’autres règles',
        friction: 'Plus de réglages, de frais et de raccords',
      },
      {
        title: 'Plugins et agence',
        description: 'Transforment chaque changement en projet',
        friction: 'Les petites modifications rejoignent une file d’attente',
      },
    ],
    closing:
      'Le problème n’est pas un mauvais outil. C’est un parcours client dont aucun système n’a vraiment la maîtrise.',
  },
  journey: {
    eyebrow: 'Pensé comme un seul parcours',
    title: 'De la première visite à la prochaine réservation.',
    body:
      'Zedos se construit autour du fonctionnement réel des activités bien-être sur réservation — pas autour des limites d’un modèle de page ou d’un widget.',
    steps: [
      { step: '01', label: 'Découvrir', detail: 'Un site fidèle à votre activité' },
      {
        step: '02',
        label: 'Choisir',
        detail: 'Le bon service et le bon praticien',
      },
      {
        step: '03',
        label: 'Réserver',
        detail: 'Les disponibilités sans quitter l’expérience',
      },
      { step: '04', label: 'Payer', detail: 'Un paiement clair et rassurant' },
      {
        step: '05',
        label: 'Revenir',
        detail: 'Confirmation, assistance et nouvelle réservation',
      },
    ],
    statusTitle: 'Le périmètre est défini avec chaque pilote.',
    statusBody:
      'Nous gardons les outils éprouvés en place tant qu’un parcours Zedos n’est pas prêt pour votre fonctionnement réel.',
  },
  execution: {
    eyebrow: 'Changez sans attendre',
    title: 'Gérez le quotidien. Obtenez la bonne aide pour le reste.',
    body:
      'Zedos ne prétend pas que chaque demande doit être traitée par l’IA. Le mode d’exécution s’adapte au travail, et vous gardez la main avant tout changement important.',
    scenarios: [
      {
        id: 'workshop',
        shortLabel: 'Lancer un atelier',
        request: 'Ajoute un atelier Reformer samedi, avec 12 places.',
        route: 'Modification courante',
        routeDetail: 'Assistée par IA',
        result:
          'Préparer la page, les informations de planning et le message de confirmation, puis tout placer en validation.',
        checklist: [
          'Page de l’atelier préparée',
          'Informations de réservation prêtes',
          'Prêt pour votre validation',
        ],
        tone: 'sage',
      },
      {
        id: 'practitioner',
        shortLabel: 'Ajouter une praticienne',
        request:
          'Ajoute Maya, son service de massage sportif et ses disponibilités du mercredi.',
        route: 'Configuration guidée',
        routeDetail: 'Informations vérifiées',
        result:
          'Relier le profil, le service et les disponibilités, signaler les informations manquantes, puis demander votre validation avant publication.',
        checklist: [
          'Profil et service reliés',
          'Disponibilités vérifiées',
          'Un point reste à valider',
        ],
        tone: 'clay',
      },
      {
        id: 'member',
        shortLabel: 'Créer un parcours membre',
        request:
          'Crée un programme de six semaines avec réservations par étapes et contenu membre.',
        route: 'Avec un développeur',
        routeDetail: 'Périmètre sur mesure',
        result:
          'Transformer la demande en périmètre clair. Validez une réalisation payante, invitez votre développeur ou gardez-la pour plus tard — sur la même base.',
        checklist: [
          'Besoins structurés',
          'Options de réalisation comparées',
          'Vous choisissez la suite',
        ],
        tone: 'blue',
      },
    ],
    scenarioAriaLabel: 'Scénarios de changement pour une activité bien-être',
    requestLabel: 'Une demande métier réelle',
    executionRouteLabel: 'Mode d’exécution',
    proposedNextStep: 'Prochaine étape proposée',
    sameProject:
      'Le même projet, que le travail soit réalisé par vous, Zedos ou votre développeur.',
    disclaimer:
      'Parcours illustratif. Les fonctions exactes dépendent du périmètre convenu avec chaque pilote.',
    pathsEyebrow: 'Une plateforme, trois façons d’avancer',
    pathsTitle: 'Faites évoluer l’activité à votre manière.',
    pathsBody:
      'Le quotidien reste simple. La liberté technique reste disponible quand vous en avez besoin.',
    paths: [
      {
        number: '01',
        title: 'Modifiez vous-même',
        body:
          'Mettez à jour les textes, images, informations pratiques et réglages simples dans une interface claire, même depuis votre téléphone.',
      },
      {
        number: '02',
        title: 'Demandez à Zedos',
        body:
          'Utilisez le langage naturel pour les tâches courantes et peu risquées. Validez la proposition avant sa mise en ligne.',
      },
      {
        number: '03',
        title: 'Faites intervenir un expert',
        body:
          'Pour un travail complexe ou risqué, recevez une voie claire. Passez par Zedos, votre développeur ou reportez la demande.',
      },
    ],
    noticeTitle: 'L’IA est une voie d’exécution',
    noticeBody:
      'pas un chèque en blanc pour modifier la production. Le travail complexe est chiffré séparément et ne commence qu’après votre accord.',
  },
  ownership: {
    eyebrow: 'Pas de cul-de-sac',
    title: 'Commencez simplement. Gardez toutes vos options.',
    body:
      'La plupart des outils simples deviennent contraignants dès que votre activité sort du modèle prévu. Zedos repose sur un vrai code source et une vraie base de données que votre entreprise peut conserver, étendre ou confier à une autre équipe.',
    quote:
      'Si Zedos n’est plus la meilleure équipe pour l’exploiter, l’actif doit tout de même rester à vous.',
    assetLabel: 'L’actif appartient à',
    assetOwner: 'Votre entreprise',
    commitments: [
      {
        title: 'Votre code',
        body: 'Un dépôt Git standard, pas un format opaque de constructeur de pages.',
      },
      {
        title: 'Vos données',
        body:
          'Des informations structurées avec une procédure documentée pour les exporter et les reprendre.',
      },
      {
        title: 'Votre développeur',
        body:
          'Travaillez avec votre partenaire technique. Aucune agence imposée.',
      },
      {
        title: 'Votre prochain produit',
        body:
          'Ajoutez un espace membre, un parcours sur mesure ou une intégration sur la même base.',
      },
    ],
    detailsSummary: 'Voir les technologies standard utilisées',
    detailsBody:
      'La direction produit repose notamment sur Next.js, TypeScript, PostgreSQL, des dépôts Git standard et une architecture CMS modulaire. Ces détails sont facultatifs pour les dirigeants et utiles aux développeurs.',
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Git', 'CMS modulaire'],
    technologiesLabel: 'Exemples de technologies',
  },
  comparison: {
    eyebrow: 'Un autre compromis',
    title: 'Choisissez le compromis que vous voulez arrêter de subir.',
    body:
      'Aucune plateforme ne convient à toutes les entreprises. La vraie question est ce qui se passe lorsque vos besoins dépassent l’outil de départ.',
    items: [
      {
        name: 'Constructeur de site fermé',
        strength: 'Premier lancement rapide',
        tradeoff: 'Parcours sur mesure et reprise du projet limités',
        featured: false,
      },
      {
        name: 'Site + logiciel de réservation',
        strength: 'Réservation standard éprouvée',
        tradeoff: 'La marque, les données et le parcours client restent séparés',
        featured: false,
      },
      {
        name: 'Développement sur mesure classique',
        strength: 'Grande flexibilité',
        tradeoff:
          'Périmètre initial plus lourd et changements quotidiens plus lents',
        featured: false,
      },
      {
        name: 'Zedos',
        strength:
          'Un départ simple avec une voie vers un logiciel sur mesure qui vous appartient',
        tradeoff:
          'Plus jeune que les plateformes établies ; chaque pilote est cadré avec soin',
        featured: true,
      },
    ],
    featuredLabel: 'Le pari Zedos',
    strengthLabel: 'Point fort',
    tradeoffLabel: 'Compromis',
    caveatLabel: 'En toute transparence :',
    caveatBody:
      'Zedos n’est pas aujourd’hui le choix le plus sûr pour toutes les entreprises. Il se construit pour celles qui savent que leur prochain changement ne rentrera pas proprement dans leurs outils actuels.',
  },
  pilot: {
    initials: 'LB',
    label: 'Premier pilote',
    name: 'L*****.******',
    shortDescription:
      'Une vraie activité bien-être qui façonne avec nous les premiers parcours.',
    eyebrow: 'Construit avec une vraie entreprise, pas un brief fictif',
    title: 'Le premier pilote commence avec L*****.******.',
    body:
      'Nous confrontons Zedos aux décisions, contraintes et changements quotidiens d’une vraie activité bien-être. Les premiers partenaires bénéficient de la même approche directe avec le fondateur : cartographier les outils actuels, identifier ce qui peut évoluer sans risque et dire clairement ce qui n’est pas encore prêt.',
    points: [
      'De vraies contraintes opérationnelles',
      'Implication directe du fondateur',
      'Des limites fonctionnelles claires',
      'Aucune migration complète imposée',
    ],
    quote: 'Un outil simple ne devrait jamais devenir une impasse.',
    signature: 'Fondateur de Zedos',
  },
  earlyAccess: {
    eyebrow: 'Accès anticipé avec le fondateur',
    title: 'Montrez-nous les outils que vous ne voulez plus gérer.',
    body:
      'Demandez une analyse concrète de votre site et de votre système de réservation. Si votre activité correspond au pilote actuel, nous préciserons ce que Zedos peut réunir maintenant, ce qui doit rester en place et ce qui pourra venir ensuite.',
    value: [
      'Une analyse de votre site et de votre parcours de réservation avec le fondateur',
      'Une recommandation claire : garder, connecter ou remplacer plus tard',
      'Une influence directe sur la feuille de route de la réservation',
      'Un périmètre et des conditions présentés avant tout engagement',
    ],
    bestFitTitle: 'Bon profil',
    bestFit: [
      'Les réservations sont au cœur de votre activité',
      'Votre marque et l’expérience client comptent',
      'Vous prévoyez un changement important dans les six prochains mois',
      'Votre équipe peut partager des retours directs',
    ],
    tooEarlyTitle: 'Probablement trop tôt',
    tooEarly: [
      'Vous cherchez seulement un site modèle gratuit',
      'Un grand catalogue de produits est au cœur de votre activité',
      'Vous avez besoin d’un lancement autonome et immédiat',
    ],
  },
  waitlist: {
    optional: 'Facultatif',
    selectOne: 'Sélectionnez une option',
    saving: 'Enregistrement…',
    noErrors: 'Aucune erreur dans le formulaire',
    contact: {
      step: 'Étape 1 sur 2',
      title: 'Commençons par l’essentiel.',
      body:
        'Votre candidature est enregistrée à cette étape. La suivante est facultative.',
      name: 'Votre nom',
      email: 'E-mail professionnel',
      businessName: 'Nom de l’entreprise',
      businessType: 'Type d’activité',
      businessTypePlaceholder: 'Sélectionnez votre activité',
      businessTypeOptions: [
        { value: 'pilates', label: 'Studio de Pilates' },
        { value: 'yoga', label: 'Studio de yoga' },
        { value: 'fitness', label: 'Studio ou salle de fitness' },
        { value: 'personal-training', label: 'Coach sportif' },
        { value: 'massage', label: 'Cabinet de massage' },
        { value: 'wellness-centre', label: 'Centre de bien-être' },
        { value: 'beauty-care', label: 'Professionnel de la beauté ou du soin' },
        {
          value: 'other-booking-business',
          label: 'Autre activité sur réservation',
        },
      ],
      website: 'Site web ou profil social',
      websiteTrap: 'Site web de l’entreprise',
      consentPrefix:
        'J’accepte d’être contacté au sujet de l’accès anticipé à Zedos. Consulter la ',
      privacyPolicy: 'politique de confidentialité',
      consentSuffix: '.',
      submit: 'Demander un accès anticipé',
      reassurance:
        'Pas de séquence commerciale générique. Chaque candidature est étudiée par notre équipe.',
    },
    qualification: {
      step: 'Candidature enregistrée',
      title: 'Aidez-nous à évaluer l’adéquation.',
      body:
        'Quelques informations nous aident à comprendre votre organisation. Tous les champs ci-dessous sont facultatifs.',
      practitioners: 'Praticiens',
      practitionerOptions: [
        { value: 'solo', label: 'Seulement moi' },
        { value: '2-5', label: '2 à 5' },
        { value: '6-15', label: '6 à 15' },
        { value: '16-plus', label: '16 et plus' },
      ],
      locations: 'Lieux',
      locationOptions: [
        { value: 'online', label: 'Uniquement en ligne' },
        { value: '1', label: 'Un' },
        { value: '2-3', label: '2 à 3' },
        { value: '4-plus', label: '4 et plus' },
      ],
      bookingPlatform: 'Plateforme de réservation actuelle',
      bookingPlatformOptions: [
        { value: 'none', label: 'Aucune' },
        { value: 'calendly', label: 'Calendly' },
        { value: 'planity', label: 'Planity' },
        { value: 'mindbody', label: 'Mindbody' },
        { value: 'fresha', label: 'Fresha' },
        { value: 'booksy', label: 'Booksy' },
        { value: 'momence', label: 'Momence' },
        { value: 'other', label: 'Autre' },
      ],
      mainChallenge: 'Difficulté principale',
      challengeOptions: [
        { value: 'fragmented-tools', label: 'Trop d’outils déconnectés' },
        { value: 'booking-experience', label: 'Le parcours de réservation' },
        { value: 'slow-changes', label: 'Les changements prennent trop de temps' },
        { value: 'brand-limitations', label: 'Les limites de marque ou de design' },
        {
          value: 'custom-workflow',
          label: 'Un parcours sur mesure que je ne peux pas créer',
        },
        {
          value: 'replace-platform',
          label: 'Le remplacement de la plateforme actuelle',
        },
      ],
      timeframe: 'Quand souhaitez-vous changer ?',
      timeframeOptions: [
        { value: '0-3-months', label: 'Dans les 3 mois' },
        { value: '3-6-months', label: 'Dans 3 à 6 mois' },
        { value: '6-12-months', label: 'Dans 6 à 12 mois' },
        { value: 'exploring', label: 'Je me renseigne' },
      ],
      desiredChange: 'Quel changement compte le plus pour vous ?',
      desiredChangePlaceholder: 'Une courte description suffit.',
      submit: 'Partager mon organisation',
      skip: 'Passer cette étape',
    },
    complete: {
      eyebrow: 'Candidature terminée',
      title: 'Merci. Vous êtes sur la liste.',
      body:
        'Nous étudions chaque candidature. Si votre organisation correspond au pilote actuel, le fondateur vous écrira pour vous présenter la suite. Vous ne serez pas ajouté à une newsletter générique.',
    },
    errors: {
      consent:
        'Merci de confirmer que nous pouvons vous contacter au sujet de l’accès anticipé.',
      saveApplication:
        'Nous n’avons pas pu enregistrer votre candidature. Réessayez.',
      missingReference:
        'La référence de votre candidature est introuvable. Recommencez la première étape.',
      saveDetails:
        'Nous n’avons pas pu enregistrer ces informations. Réessayez.',
    },
  },
  faq: {
    eyebrow: 'Des réponses claires',
    title: 'Sachez précisément ce que vous rejoignez.',
    body:
      'Zedos est encore jeune. Ces réponses distinguent la direction du produit de ce que chaque pilote peut utiliser aujourd’hui.',
    items: [
      {
        id: 'ai-builder',
        question: 'Zedos est-il un autre créateur de site par IA ?',
        answer:
          'Non. L’IA peut aider sur les tâches courantes, mais le résultat reste un vrai code source modifiable et des données structurées, pas un format de page propriétaire généré par IA. Zedos est conçu pour la modification manuelle, le développement professionnel et la maîtrise à long terme.',
      },
      {
        id: 'available',
        question: 'Qu’est-ce qui est disponible aujourd’hui ?',
        answer:
          'Zedos est en pilote privé. Les interfaces de cette page présentent la direction du produit ; elles ne signifient pas que chaque parcours de réservation est déjà en ligne. Le périmètre est défini pilote par pilote, avec une distinction claire entre ce qui est prêt, ce qui peut rester connecté à un outil existant et ce qui est encore prévu.',
      },
      {
        id: 'replace-booking',
        question:
          'Zedos peut-il remplacer ma plateforme de réservation actuelle ?',
        answer:
          'Potentiellement, mais pas automatiquement dès le premier jour. Nous commençons par cartographier les règles de réservation indispensables à votre activité. Un premier pilote peut conserver la plateforme actuelle pendant que Zedos prend en charge le site et certaines étapes du parcours. Nous ne recommandons un remplacement que lorsque le fonctionnement requis est prêt.',
      },
      {
        id: 'ownership',
        question: 'Mon site m’appartiendra-t-il ?',
        answer:
          'Le modèle visé est clair : votre entreprise garde la maîtrise du code et des données de son projet. Les conditions de propriété, d’accès, d’export, d’infrastructure et de transfert sont documentées dans l’accord pilote avant le début du travail.',
      },
      {
        id: 'leave',
        question: 'Que se passe-t-il si je quitte Zedos ?',
        answer:
          'Vous devez pouvoir reprendre le projet, déplacer l’infrastructure ou confier le code standard à une autre équipe compétente. La procédure exacte de transfert sera documentée et testée avant de devenir une promesse contractuelle sans réserve.',
      },
      {
        id: 'developer',
        question: 'Mon propre développeur peut-il intervenir ?',
        answer:
          'Oui. Zedos utilise des technologies standard et des workflows Git afin qu’un développeur ou une agence disposant des compétences adaptées puisse étendre le même projet. L’accès technique reste facultatif pour le dirigeant.',
      },
      {
        id: 'ai-safety',
        question: 'L’IA peut-elle casser mon site en production ?',
        answer:
          'L’IA ne reçoit pas une autorisation générale de modifier les parcours importants en production. Les demandes courantes doivent rester encadrées et vérifiables. Le travail ambigu, spécialisé ou risqué est confié à une personne ou reporté.',
      },
      {
        id: 'ai-cannot',
        question: 'Que se passe-t-il lorsque l’IA ne peut pas faire le travail ?',
        answer:
          'Vous obtenez une suite claire : valider une réalisation chiffrée séparément, solliciter votre développeur, traiter la demande autrement ou la reporter. Un échec de l’IA ne devient jamais une prestation payante imposée.',
      },
      {
        id: 'only-website',
        question: 'Zedos est-il seulement un site web ?',
        answer:
          'Le projet peut commencer par là, mais sa base est conçue pour accueillir un parcours de réservation plus riche, un espace membre, des opérations sur mesure et des intégrations. L’objectif est de faire évoluer le même projet au lieu de migrer à chaque étape.',
      },
      {
        id: 'pricing',
        question: 'Combien coûtera Zedos ?',
        answer:
          'Les tarifs publics ne sont pas encore finalisés. Le périmètre du pilote, les coûts récurrents de la plateforme et le développement facturé séparément seront expliqués avant tout engagement. Rejoindre la liste d’accès anticipé ne vous engage à aucun achat.',
      },
    ],
  },
  footer: {
    tagline:
      'Une base numérique flexible pour les activités bien-être qui vivent des réservations.',
    navigationLabel: 'Navigation du pied de page',
    explore: 'Explorer',
    detailsLabel: 'Informations légales et contact',
    details: 'Informations',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    contact: 'Nous contacter',
    status: 'Pilote privé · Paris, France.',
    existingPilot: 'Déjà pilote ? Se connecter',
  },
  seo: {
    title: 'Site web & réservation pour studios bien-être | Zedos',
    description:
      'Créez un site et un parcours de réservation à votre image, capables d’évoluer avec votre activité. Gardez la maîtrise de votre code, de vos données et de la suite.',
    socialTitle: 'Une base plus solide pour votre activité bien-être',
    socialDescription:
      'Site web, réservation et liberté d’évoluer — sans plateforme fermée ni nouvelle refonte. Demandez un accès anticipé avec le fondateur de Zedos.',
    twitterDescription:
      'Site web, réservation et liberté d’évoluer — sans plateforme fermée ni nouvelle refonte.',
  },
} satisfies LandingCopy;
