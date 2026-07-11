import type { LandingCopy } from './landing-copy.types';

export const landingCopyEn = {
  accessibility: {
    skipToContent: 'Skip to content',
    logoHome: 'Zedos home',
  },
  navigation: {
    primaryLabel: 'Primary navigation',
    howItWorks: 'How it works',
    whyZedos: 'Why Zedos',
    earlyAccess: 'Early access',
    earlyAccessMobile: 'Early access',
    apply: 'Apply for early access',
    switchLanguage: 'View the site in French',
  },
  hero: {
    eyebrow: 'Private pilot · Built for appointment-based businesses',
    titleStart: 'Your digital business. ',
    titleEmphasis: 'Built to evolve',
    titleEnd: ' with you.',
    mobileBody:
      'Website, bookings, payments, content, and future custom features on one flexible foundation—without giving up your code or data.',
    desktopBody:
      'Zedos brings your website, bookings, payments, content, and future custom workflows onto one flexible foundation—without giving up your code, your data, or your choice of developer.',
    primaryCta: 'Apply for early access',
    secondaryCta: 'See how it works',
    trustPoints: [
      'Founder-led onboarding',
      'No commitment',
      'Keep your code and data',
      'No technical knowledge needed',
    ],
    preview: {
      caption: 'Illustrative early product concept',
      studioName: 'Studio Juniper · Paris 11',
      headlineFirst: 'Move well.',
      headlineSecond: 'Feel stronger.',
      description:
        'Reformer Pilates in small groups, with thoughtful coaching for every body.',
      findClass: 'Find a class',
      date: 'Saturday, 18 July',
      chooseClass: 'Choose your class',
      slots: [
        { time: '09:00', title: 'Reformer flow', detail: 'Maya · 3 places' },
        {
          time: '10:30',
          title: 'Foundations',
          detail: 'Ana · 5 places',
          selected: true,
        },
        { time: '12:00', title: 'Power reformer', detail: 'Maya · Waitlist' },
      ],
      continueWith: 'Continue with Foundations',
      workshopReady: 'Weekend workshop ready',
      workshopDetail:
        'Page, booking details, and confirmation copy are waiting for review.',
    },
  },
  problem: {
    eyebrow: 'One client journey. Too many systems.',
    title: 'Your customers feel every gap between your tools.',
    body:
      'They discover you on one site, book in another, pay through a third, and receive reminders from somewhere else. You manage every handoff—and wait on a plugin, provider, or agency whenever the business changes.',
    stack: [
      {
        title: 'Website',
        description: 'Looks like your brand',
        friction: 'The journey stops at the booking link',
      },
      {
        title: 'Booking platform',
        description: 'Runs its own journey',
        friction: 'Your experience becomes its template',
      },
      {
        title: 'Payments & reminders',
        description: 'Adds another set of rules',
        friction: 'More settings, fees, and handoffs',
      },
      {
        title: 'Plugins & agency',
        description: 'Turns each change into a project',
        friction: 'Simple updates join a queue',
      },
    ],
    closing:
      'The problem is not one bad tool. It is a customer experience no one system truly owns.',
  },
  journey: {
    eyebrow: 'Designed as one journey',
    title: 'From first visit to the next booking.',
    body:
      'Zedos is being built around how businesses that run on appointments actually work—not around the limits of a page template or booking widget.',
    steps: [
      { step: '01', label: 'Discover', detail: 'A site that feels like your business' },
      { step: '02', label: 'Choose', detail: 'The right service and practitioner' },
      {
        step: '03',
        label: 'Book',
        detail: 'Availability without leaving the experience',
      },
      { step: '04', label: 'Pay', detail: 'A clear, trusted checkout' },
      {
        step: '05',
        label: 'Return',
        detail: 'Confirmation, support, and rebooking',
      },
    ],
    statusTitle: 'Early-access scope is agreed with each pilot.',
    statusBody:
      'We keep proven tools in place until a Zedos workflow is ready for the way your business actually operates.',
  },
  execution: {
    eyebrow: 'Change without the queue',
    title: 'Run the everyday. Get the right help for the rest.',
    body:
      'Zedos does not pretend every request should be handled by AI. It chooses a safer path based on the work, then keeps you in control before anything important changes.',
    scenarios: [
      {
        id: 'workshop',
        shortLabel: 'Launch a workshop',
        request: 'Add a Saturday reformer workshop with 12 places.',
        route: 'Routine change',
        routeDetail: 'AI-assisted',
        result:
          'Draft the page, prepare the schedule details, update confirmation copy, and place everything in review.',
        checklist: [
          'Workshop page drafted',
          'Booking details prepared',
          'Ready for your review',
        ],
        tone: 'sage',
      },
      {
        id: 'practitioner',
        shortLabel: 'Add a practitioner',
        request: 'Add Maya, her sports massage service, and Wednesday availability.',
        route: 'Guided setup',
        routeDetail: 'Details checked',
        result:
          'Map the profile, service, and availability; flag missing details; ask for approval before publishing.',
        checklist: [
          'Profile and service mapped',
          'Availability checked',
          'One detail needs approval',
        ],
        tone: 'clay',
      },
      {
        id: 'member',
        shortLabel: 'Build a member journey',
        request:
          'Create a six-week programme with staged booking and member content.',
        route: 'Developer-led',
        routeDetail: 'Custom scope',
        result:
          'Turn the request into a clear scope. Approve paid implementation, invite your developer, or save it for later—on the same foundation.',
        checklist: [
          'Requirements mapped',
          'Implementation paths compared',
          'You choose the next step',
        ],
        tone: 'blue',
      },
    ],
    scenarioAriaLabel: 'Appointment-based business change scenarios',
    requestLabel: 'A real business request',
    executionRouteLabel: 'Execution route',
    proposedNextStep: 'Proposed next step',
    sameProject:
      'Same project, whether the work is handled by you, Zedos, or your developer.',
    disclaimer: 'Illustrative workflow. Exact pilot capabilities depend on agreed scope.',
    pathsEyebrow: 'One platform, three paths',
    pathsTitle: 'Move the business forward your way.',
    pathsBody:
      'Everyday use stays simple. Technical freedom remains available when you need it.',
    paths: [
      {
        number: '01',
        title: 'Edit it yourself',
        body:
          'Update content, images, business details, and simple settings through a clear visual experience—even from your phone.',
      },
      {
        number: '02',
        title: 'Ask Zedos',
        body:
          'Use natural language for routine, low-risk work. Review the proposed change before it goes live.',
      },
      {
        number: '03',
        title: 'Bring in expertise',
        body:
          'When work is complex or risky, receive a clear path. Use Zedos, your own developer, or defer the change.',
      },
    ],
    noticeTitle: 'AI is one execution path',
    noticeBody:
      'not a blank cheque to change production. Complex work is scoped separately and only starts after you approve it.',
  },
  ownership: {
    eyebrow: 'No dead end',
    title: 'Businesses evolve. Their software should too.',
    body:
      'Most easy tools become restrictive when your business no longer fits their template. Zedos is built on a real codebase and database that your business can keep, extend, or hand to another team.',
    quote:
      'If Zedos stops being the best team to run it, you should still keep the asset.',
    assetLabel: 'The asset belongs with',
    assetOwner: 'Your business',
    commitments: [
      {
        title: 'Your code',
        body: 'A standard Git repository, not an opaque page-builder format.',
      },
      {
        title: 'Your data',
        body: 'Structured information with a documented path to export and take over.',
      },
      {
        title: 'Your developer',
        body: 'Work with your own technical partner. No approved-agency lock.',
      },
      {
        title: 'Your next product',
        body:
          'Add a member area, custom workflow, or integration on the same foundation.',
      },
    ],
    detailsSummary: 'See the standard technology underneath',
    detailsBody:
      'The product direction uses technologies such as Next.js, TypeScript, PostgreSQL, standard Git repositories, and a modular CMS architecture. These details are optional for owners and useful for developers.',
    technologies: ['Next.js', 'TypeScript', 'PostgreSQL', 'Git', 'Modular CMS'],
    technologiesLabel: 'Technology examples',
  },
  comparison: {
    eyebrow: 'A different trade-off',
    title: 'Choose the compromise you want to stop making.',
    body:
      'There is no perfect platform for every business. The important question is what happens when your needs stop fitting the original tool.',
    items: [
      {
        name: 'Closed website builder',
        strength: 'Fast first launch',
        tradeoff: 'Custom workflows and clean handoff are limited',
        featured: false,
      },
      {
        name: 'Website + booking SaaS',
        strength: 'Mature standard booking',
        tradeoff: 'Brand, data, and customer journey stay split',
        featured: false,
      },
      {
        name: 'Traditional custom build',
        strength: 'Deep flexibility',
        tradeoff: 'Higher upfront scope and a slower everyday change loop',
        featured: false,
      },
      {
        name: 'Zedos',
        strength: 'One business platform with an ownable path to custom software',
        tradeoff:
          'Earlier than established platforms; every pilot is scoped carefully',
        featured: true,
      },
    ],
    featuredLabel: 'The Zedos bet',
    strengthLabel: 'Strong at',
    tradeoffLabel: 'Trade-off',
    caveatLabel: 'The honest caveat:',
    caveatBody:
      'Zedos is not the safest choice for every business today. It is being built for businesses that know their next change will not fit neatly inside the current stack.',
  },
  pilot: {
    initials: 'LB',
    label: 'Founding pilot',
    name: 'L*****.******',
    shortDescription:
      'A real wellness business shaping the first appointment-led workflows with us.',
    eyebrow: 'Built with a real business, not a demo brief',
    title: 'The first pilot starts with L*****.******.',
    body:
      'We are shaping Zedos against the decisions, constraints, and daily changes of a real wellness business. Early partners receive the same founder-led approach: we map the current stack, identify what can move safely, and say plainly what is not ready yet.',
    points: [
      'Real operating constraints',
      'Direct founder involvement',
      'Clear capability boundaries',
      'No forced full-stack migration',
    ],
    quote: 'Easy tools should not become a dead end.',
    signature: 'Founder, Zedos',
  },
  earlyAccess: {
    eyebrow: 'Founder-led early access',
    title: 'Bring us the stack you want to stop managing.',
    body:
      'Apply for a practical review of your digital setup. If there is a fit for the current pilot, we will map what Zedos could unify now, what should stay in place, and what can come later.',
    value: [
      'A founder-led review of your current customer journey',
      'A clear keep, connect, replace-later recommendation',
      'Direct influence on the product roadmap',
      'Pilot scope and terms shared before any commitment',
    ],
    bestFitTitle: 'Best fit',
    bestFit: [
      'Bookings are central to your business',
      'Brand and customer experience matter',
      'A meaningful change is planned in the next six months',
      'Your team can share direct feedback',
    ],
    tooEarlyTitle: 'Probably too early',
    tooEarly: [
      'You only need a free template site',
      'A large product catalogue is the core business',
      'You need an instant self-serve launch today',
    ],
  },
  waitlist: {
    optional: 'Optional',
    selectOne: 'Select one',
    saving: 'Saving…',
    noErrors: 'No form errors',
    contact: {
      step: 'Step 1 of 2',
      title: 'Start with the basics.',
      body: 'We save your application here. The next step is optional.',
      name: 'Your name',
      email: 'Work email',
      businessName: 'Business name',
      businessType: 'Business type',
      businessTypePlaceholder: 'Select your business',
      businessTypeOptions: [
        { value: 'pilates', label: 'Pilates studio' },
        { value: 'yoga', label: 'Yoga studio' },
        { value: 'fitness', label: 'Fitness studio' },
        { value: 'personal-training', label: 'Personal trainer' },
        { value: 'massage', label: 'Massage practice' },
        { value: 'wellness-centre', label: 'Wellness centre' },
        { value: 'beauty-care', label: 'Beauty salon or care professional' },
        { value: 'healthcare', label: 'Clinic or healthcare practice' },
        { value: 'creative-services', label: 'Creative service business' },
        { value: 'professional-services', label: 'Professional services firm' },
        { value: 'education', label: 'Education or tutoring business' },
        {
          value: 'other-booking-business',
          label: 'Other appointment-based business',
        },
      ],
      website: 'Website or social profile',
      websiteTrap: 'Company website',
      consentPrefix: 'I agree to be contacted about Zedos early access. Read the ',
      privacyPolicy: 'privacy policy',
      consentSuffix: '.',
      submit: 'Apply for early access',
      reassurance: 'No generic sales sequence. We review every application ourselves.',
    },
    qualification: {
      step: 'Application saved',
      title: 'Help us review the fit.',
      body:
        'A little context helps us understand your setup. Every field below is optional.',
      practitioners: 'Practitioners',
      practitionerOptions: [
        { value: 'solo', label: 'Just me' },
        { value: '2-5', label: '2–5' },
        { value: '6-15', label: '6–15' },
        { value: '16-plus', label: '16+' },
      ],
      locations: 'Locations',
      locationOptions: [
        { value: 'online', label: 'Online only' },
        { value: '1', label: 'One' },
        { value: '2-3', label: '2–3' },
        { value: '4-plus', label: '4+' },
      ],
      bookingPlatform: 'Current booking platform',
      bookingPlatformOptions: [
        { value: 'none', label: 'None' },
        { value: 'calendly', label: 'Calendly' },
        { value: 'planity', label: 'Planity' },
        { value: 'mindbody', label: 'Mindbody' },
        { value: 'fresha', label: 'Fresha' },
        { value: 'booksy', label: 'Booksy' },
        { value: 'momence', label: 'Momence' },
        { value: 'other', label: 'Other' },
      ],
      mainChallenge: 'Main frustration',
      challengeOptions: [
        { value: 'fragmented-tools', label: 'Too many disconnected tools' },
        { value: 'booking-experience', label: 'The booking experience' },
        { value: 'slow-changes', label: 'Changes take too long' },
        { value: 'brand-limitations', label: 'Brand or design limitations' },
        { value: 'custom-workflow', label: 'A custom workflow I cannot build' },
        { value: 'replace-platform', label: 'Replacing the current platform' },
      ],
      timeframe: 'When would you like to make a change?',
      timeframeOptions: [
        { value: '0-3-months', label: 'Within 3 months' },
        { value: '3-6-months', label: '3–6 months' },
        { value: '6-12-months', label: '6–12 months' },
        { value: 'exploring', label: 'Just exploring' },
      ],
      desiredChange: 'What would you most like to change?',
      desiredChangePlaceholder: 'A short description is enough.',
      submit: 'Share my setup',
      skip: 'Skip for now',
    },
    complete: {
      eyebrow: 'Application complete',
      title: 'Thanks. You are on the list.',
      body:
        'We review every application ourselves. If your setup fits the current pilot, the founder will email you with next steps. We will not add you to a generic newsletter.',
    },
    errors: {
      consent: 'Please confirm that we may contact you about early access.',
      saveApplication: 'We could not save your application.',
      missingReference: 'Your application reference is missing. Please start again.',
      saveDetails: 'We could not save these details.',
    },
  },
  faq: {
    eyebrow: 'Questions, answered plainly',
    title: 'Know what you are joining.',
    body:
      'Zedos is early. These answers separate the product direction from what each pilot can use today.',
    items: [
      {
        id: 'ai-builder',
        question: 'Is Zedos another AI website builder?',
        answer:
          'No. AI can help with routine work, but the result is a real, editable codebase and structured data—not a proprietary AI-generated page format. Zedos is designed for manual editing, professional development, and long-term ownership.',
      },
      {
        id: 'available',
        question: 'What is available today?',
        answer:
          'Zedos is in private pilot. The interfaces on this page describe the product direction, not a claim that every booking workflow is already live. Scope is agreed pilot by pilot, and we will say clearly what is ready, what can connect to an existing tool, and what remains planned.',
      },
      {
        id: 'replace-booking',
        question: 'Can Zedos replace my current booking platform?',
        answer:
          'Potentially, but not by default on day one. We first map the booking rules your business relies on. A pilot may keep the current platform connected while Zedos takes over the website and selected parts of the journey. We only recommend replacement when the required workflow is ready.',
      },
      {
        id: 'ownership',
        question: 'Will I own my website?',
        answer:
          'The intended model is clear: your business retains control of its project code and data. Ownership, access, export, infrastructure, and handover terms are documented in the pilot agreement before work begins.',
      },
      {
        id: 'leave',
        question: 'What happens if I leave?',
        answer:
          'You should be able to take over the project, move the infrastructure, or hand the standard codebase to another capable team. The exact handover process will be documented and tested before this becomes an unconditional contractual claim.',
      },
      {
        id: 'developer',
        question: 'Can my own developer work on it?',
        answer:
          'Yes. Zedos uses standard technologies and Git-based workflows so an appropriately skilled developer or agency can extend the same project. Technical access is optional for the business owner, not a requirement for using Zedos.',
      },
      {
        id: 'ai-safety',
        question: 'Can AI break my production website?',
        answer:
          'AI is not given blanket permission to change important production workflows. Routine requests should be constrained and reviewable. Ambiguous, specialised, or high-risk work is routed to a person or deferred.',
      },
      {
        id: 'ai-cannot',
        question: 'What happens when AI cannot do the work?',
        answer:
          'You receive a clear next path: approve separately scoped implementation, ask your own developer, handle it independently, or leave it for later. A failed AI attempt never becomes forced paid work.',
      },
      {
        id: 'only-website',
        question: 'Is Zedos only a website?',
        answer:
          'No. It is a business platform that can start with your website, then support booking, payments, communication, content, automation, custom operations, and integrations. The point is to evolve the same project instead of migrating each time.',
      },
      {
        id: 'pricing',
        question: 'How much will it cost?',
        answer:
          'Public pricing is not final. Pilot scope, ongoing platform costs, and separately priced development work will be explained before commitment. Joining the early-access list is not a purchase commitment.',
      },
    ],
  },
  footer: {
    tagline: 'A flexible business platform for companies that run on appointments.',
    navigationLabel: 'Footer navigation',
    explore: 'Explore',
    detailsLabel: 'Legal and contact',
    details: 'Details',
    privacy: 'Privacy',
    terms: 'Terms',
    contact: 'Contact',
    status: 'Private pilot · Paris, France.',
  },
  seo: {
    title: 'Business Platform for Appointment-Based Companies | Zedos',
    description:
      'Build and evolve your website, bookings, payments, content, and customer journey on one flexible platform. Keep control of your code, data, and future.',
    socialTitle: 'Built for businesses that run on appointments',
    socialDescription:
      'One platform for your digital business, with room to grow—without a closed system or another rebuild. Apply for founder-led early access to Zedos.',
    twitterDescription:
      'One platform for your digital business, with room to grow—without a closed system or another rebuild.',
  },
} satisfies LandingCopy;
