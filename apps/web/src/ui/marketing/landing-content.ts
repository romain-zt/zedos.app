export const fragmentedStack = [
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
] as const;

export const bookingJourney = [
  { step: '01', label: 'Discover', detail: 'A site that feels like your business' },
  { step: '02', label: 'Choose', detail: 'The right service and practitioner' },
  { step: '03', label: 'Book', detail: 'Availability without leaving the experience' },
  { step: '04', label: 'Pay', detail: 'A clear, trusted checkout' },
  { step: '05', label: 'Return', detail: 'Confirmation, support, and rebooking' },
] as const;

export const scenarios = [
  {
    id: 'workshop',
    shortLabel: 'Launch a workshop',
    request: 'Add a Saturday reformer workshop with 12 places.',
    route: 'Routine change',
    routeDetail: 'AI-assisted',
    result:
      'Draft the page, prepare the schedule details, update confirmation copy, and place everything in review.',
    checklist: ['Workshop page drafted', 'Booking details prepared', 'Ready for your review'],
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
    checklist: ['Profile and service mapped', 'Availability checked', 'One detail needs approval'],
    tone: 'clay',
  },
  {
    id: 'member',
    shortLabel: 'Build a member journey',
    request: 'Create a six-week programme with staged booking and member content.',
    route: 'Developer-led',
    routeDetail: 'Custom scope',
    result:
      'Turn the request into a clear scope. Approve paid implementation, invite your developer, or save it for later—on the same foundation.',
    checklist: ['Requirements mapped', 'Implementation paths compared', 'You choose the next step'],
    tone: 'blue',
  },
] as const;

export const executionPaths = [
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
] as const;

export const ownershipCommitments = [
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
    body: 'Add a member area, custom workflow, or integration on the same foundation.',
  },
] as const;

export const comparisons = [
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
    strength: 'Simple start with an ownable path to custom software',
    tradeoff: 'Earlier than established platforms; every pilot is scoped carefully',
    featured: true,
  },
] as const;

export const earlyAccessValue = [
  'A founder-led review of your current site and booking journey',
  'A clear keep, connect, replace-later recommendation',
  'Direct influence on the booking roadmap',
  'Pilot scope and terms shared before any commitment',
] as const;

export const bestFit = [
  'Bookings are central to your business',
  'Brand and customer experience matter',
  'A meaningful change is planned in the next six months',
  'Your team can share direct feedback',
] as const;

export const faqItems = [
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
      'It can start there, but the foundation is intended to support a richer booking journey, member experiences, custom operations, and integrations. The point is to evolve the same project instead of migrating each time.',
  },
  {
    id: 'pricing',
    question: 'How much will it cost?',
    answer:
      'Public pricing is not final. Pilot scope, ongoing platform costs, and separately priced development work will be explained before commitment. Joining the early-access list is not a purchase commitment.',
  },
] as const;

export const businessTypeOptions = [
  { value: 'pilates', label: 'Pilates studio' },
  { value: 'yoga', label: 'Yoga studio' },
  { value: 'fitness', label: 'Fitness studio' },
  { value: 'personal-training', label: 'Personal trainer' },
  { value: 'massage', label: 'Massage practice' },
  { value: 'wellness-centre', label: 'Wellness centre' },
  { value: 'beauty-care', label: 'Beauty or care professional' },
  { value: 'other-booking-business', label: 'Other booking-based business' },
] as const;
