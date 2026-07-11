export type MarketingLocale = 'en' | 'fr';

export type CopyOption = {
  value: string;
  label: string;
};

export type CopyItem = {
  title: string;
  body: string;
};

export type ScenarioTone = 'sage' | 'clay' | 'blue';

export type LandingScenario = {
  id: string;
  shortLabel: string;
  request: string;
  route: string;
  routeDetail: string;
  result: string;
  checklist: readonly string[];
  tone: ScenarioTone;
};

export type LandingCopy = {
  accessibility: {
    skipToContent: string;
    logoHome: string;
  };
  navigation: {
    primaryLabel: string;
    howItWorks: string;
    whyZedos: string;
    earlyAccess: string;
    earlyAccessMobile: string;
    apply: string;
    existingPilot: string;
    switchLanguage: string;
  };
  hero: {
    eyebrow: string;
    titleStart: string;
    titleEmphasis: string;
    titleEnd: string;
    mobileBody: string;
    desktopBody: string;
    primaryCta: string;
    secondaryCta: string;
    trustPoints: readonly string[];
    preview: {
      caption: string;
      studioName: string;
      headlineFirst: string;
      headlineSecond: string;
      description: string;
      findClass: string;
      date: string;
      chooseClass: string;
      slots: readonly {
        time: string;
        title: string;
        detail: string;
        selected?: boolean;
      }[];
      continueWith: string;
      workshopReady: string;
      workshopDetail: string;
    };
  };
  problem: {
    eyebrow: string;
    title: string;
    body: string;
    stack: readonly {
      title: string;
      description: string;
      friction: string;
    }[];
    closing: string;
  };
  journey: {
    eyebrow: string;
    title: string;
    body: string;
    steps: readonly {
      step: string;
      label: string;
      detail: string;
    }[];
    statusTitle: string;
    statusBody: string;
  };
  execution: {
    eyebrow: string;
    title: string;
    body: string;
    scenarios: readonly LandingScenario[];
    scenarioAriaLabel: string;
    requestLabel: string;
    executionRouteLabel: string;
    proposedNextStep: string;
    sameProject: string;
    disclaimer: string;
    pathsEyebrow: string;
    pathsTitle: string;
    pathsBody: string;
    paths: readonly (CopyItem & { number: string })[];
    noticeTitle: string;
    noticeBody: string;
  };
  ownership: {
    eyebrow: string;
    title: string;
    body: string;
    quote: string;
    assetLabel: string;
    assetOwner: string;
    commitments: readonly CopyItem[];
    detailsSummary: string;
    detailsBody: string;
    technologies: readonly string[];
    technologiesLabel: string;
  };
  comparison: {
    eyebrow: string;
    title: string;
    body: string;
    items: readonly {
      name: string;
      strength: string;
      tradeoff: string;
      featured: boolean;
    }[];
    featuredLabel: string;
    strengthLabel: string;
    tradeoffLabel: string;
    caveatLabel: string;
    caveatBody: string;
  };
  pilot: {
    initials: string;
    label: string;
    name: string;
    shortDescription: string;
    eyebrow: string;
    title: string;
    body: string;
    points: readonly string[];
    quote: string;
    signature: string;
  };
  earlyAccess: {
    eyebrow: string;
    title: string;
    body: string;
    value: readonly string[];
    bestFitTitle: string;
    bestFit: readonly string[];
    tooEarlyTitle: string;
    tooEarly: readonly string[];
  };
  waitlist: {
    optional: string;
    selectOne: string;
    saving: string;
    noErrors: string;
    contact: {
      step: string;
      title: string;
      body: string;
      name: string;
      email: string;
      businessName: string;
      businessType: string;
      businessTypePlaceholder: string;
      businessTypeOptions: readonly CopyOption[];
      website: string;
      websiteTrap: string;
      consentPrefix: string;
      privacyPolicy: string;
      consentSuffix: string;
      submit: string;
      reassurance: string;
    };
    qualification: {
      step: string;
      title: string;
      body: string;
      practitioners: string;
      practitionerOptions: readonly CopyOption[];
      locations: string;
      locationOptions: readonly CopyOption[];
      bookingPlatform: string;
      bookingPlatformOptions: readonly CopyOption[];
      mainChallenge: string;
      challengeOptions: readonly CopyOption[];
      timeframe: string;
      timeframeOptions: readonly CopyOption[];
      desiredChange: string;
      desiredChangePlaceholder: string;
      submit: string;
      skip: string;
    };
    complete: {
      eyebrow: string;
      title: string;
      body: string;
    };
    errors: {
      consent: string;
      saveApplication: string;
      missingReference: string;
      saveDetails: string;
    };
  };
  faq: {
    eyebrow: string;
    title: string;
    body: string;
    items: readonly {
      id: string;
      question: string;
      answer: string;
    }[];
  };
  footer: {
    tagline: string;
    navigationLabel: string;
    explore: string;
    detailsLabel: string;
    details: string;
    privacy: string;
    terms: string;
    contact: string;
    status: string;
    existingPilot: string;
  };
  seo: {
    title: string;
    description: string;
    socialTitle: string;
    socialDescription: string;
    twitterDescription: string;
  };
};
