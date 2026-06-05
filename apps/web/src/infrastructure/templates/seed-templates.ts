/**
 * Official seed templates (T01–T10) per
 * `docs/product/templates-marketplace-v1-cadrage.md`.
 *
 * Static, in-code catalog — no DB rows, no migration. Adding a template means:
 *   1. Adding its slug to `KNOWN_TEMPLATE_SLUGS` in `@repo/contracts/templates`.
 *   2. Adding the corresponding `TemplateDetail` entry below.
 *
 * Content bodies follow `GeneratePrdAiResponseSchema` so they are directly
 * usable as imported PRD content in the `use-template-on-create` flow.
 */

import type { TemplateDetail } from '@domain/templates/template';

function section(
  id: string,
  title: string,
  content: string,
  confidence: 'high' | 'medium' | 'low' = 'medium',
  openQuestions: string[] = []
): TemplateDetail['content']['sections'][number] {
  return { id, title, content, confidence, open_questions: openQuestions };
}

export const SEED_TEMPLATES: readonly TemplateDetail[] = ([
  {
    slug: 'pitch-tomorrow',
    title: 'Pitch tomorrow',
    description:
      'Express 12-section pitch deck for a deadline within 24 hours. Founder fills the minimum AI clarification (vision, target users, core features) then ships a shareable lean PRD.',
    category: 'playbook',
    journeyHint: 'express',
    sector: 'Generic',
    author: 'zedos-official',
    forkCount: 0,
    sectionsOutline: [
      { id: 'executive_summary', title: 'Executive summary' },
      { id: 'vision', title: 'Vision' },
      { id: 'target_users', title: 'Target users' },
      { id: 'core_features', title: 'Core features' },
      { id: 'user_journeys', title: 'User journeys' },
      { id: 'technical', title: 'Technical' },
      { id: 'success_metrics', title: 'Success metrics' },
      { id: 'business_model', title: 'Business model' },
      { id: 'differentiation', title: 'Differentiation' },
      { id: 'timeline', title: 'Timeline' },
      { id: 'out_of_scope', title: 'Out of scope' },
      { id: 'risks', title: 'Risks' },
    ],
    clarifyHints: [
      'One sentence: what problem do you solve and for whom?',
      'Who pays for it and who uses it day-to-day?',
      'Pick the 3 features you would demo tomorrow morning.',
    ],
    content: {
      title: 'Pitch tomorrow — express template',
      version_summary:
        'Express 12-section lean pitch deck — meant to be reviewed in 3 minutes by an investor or advisor.',
      sections: [
        section(
          'executive_summary',
          'Executive summary',
          'Five lines maximum: what, who, why now, current traction, ask.',
          'low',
          ['Replace placeholder lines with your real numbers.']
        ),
        section('vision', 'Vision', 'Problem (1 sentence) + insight (1 sentence).', 'medium'),
        section('target_users', 'Target users', 'One persona — name, job-to-be-done, pain frequency.'),
        section('core_features', 'Core features', '3 bullets — keep it MVP.'),
        section('user_journeys', 'User journeys', 'One happy path, 4-6 steps max.'),
        section('technical', 'Technical', 'Stack in 3 bullets.'),
        section('success_metrics', 'Success metrics', '2 metrics with a 90-day target.'),
        section('business_model', 'Business model', 'How you make money. One sentence.'),
        section('differentiation', 'Differentiation', 'vs. 1 named competitor.'),
        section('timeline', 'Timeline', '90 days of milestones.'),
        section('out_of_scope', 'Out of scope', '3 non-goals to keep the pitch honest.'),
        section('risks', 'Risks', '2 honest risks + mitigation.'),
      ],
    },
  },
  {
    slug: 'b2b-saas-seed',
    title: 'B2B SaaS seed',
    description:
      'Standard PRD skeleton for an early-stage B2B SaaS — ICP, buyer vs user split, pricing tiers, integration plan, security and compliance hooks.',
    category: 'prd-skeleton',
    journeyHint: 'standard',
    sector: 'B2B',
    author: 'zedos-official',
    forkCount: 0,
    sectionsOutline: [
      { id: 'executive_summary', title: 'Executive summary' },
      { id: 'icp', title: 'Ideal customer profile' },
      { id: 'buyer_vs_user', title: 'Buyer vs user split' },
      { id: 'core_features', title: 'Core features' },
      { id: 'integrations', title: 'Integrations' },
      { id: 'pricing', title: 'Pricing tiers' },
      { id: 'security_compliance', title: 'Security and compliance' },
      { id: 'success_metrics', title: 'Success metrics' },
    ],
    clarifyHints: [
      'Who has the budget vs who pushes the button daily?',
      'Which 2 SaaS tools must you integrate with on day one?',
      'What compliance posture do you need at seed (SOC2 lite? GDPR DPA?)?',
    ],
    content: {
      title: 'B2B SaaS seed — standard PRD skeleton',
      version_summary: 'Eight-section starter PRD for an early-stage B2B SaaS.',
      sections: [
        section('executive_summary', 'Executive summary', 'Product, ICP, wedge, current state, ask.'),
        section('icp', 'Ideal customer profile', 'Company size, sector, trigger event.'),
        section('buyer_vs_user', 'Buyer vs user split', 'Who pays, who uses, who champions internally.'),
        section('core_features', 'Core features', '5 must-have flows for the first 10 customers.'),
        section('integrations', 'Integrations', 'Day-1 integrations + auth providers.'),
        section('pricing', 'Pricing tiers', '3 tiers with the upgrade trigger.'),
        section('security_compliance', 'Security and compliance', 'Auth, RBAC, audit, DPA, regional storage.'),
        section('success_metrics', 'Success metrics', 'Activation, time-to-value, expansion.'),
      ],
    },
  },
  {
    slug: 'marketplace-two-sided',
    title: 'Marketplace two-sided',
    description:
      'Two-sided marketplace PRD skeleton — supply onboarding, demand acquisition, matching mechanics, payments, trust and safety.',
    category: 'prd-skeleton',
    journeyHint: 'standard',
    sector: 'Marketplace',
    author: 'zedos-official',
    forkCount: 0,
    sectionsOutline: [
      { id: 'executive_summary', title: 'Executive summary' },
      { id: 'supply_side', title: 'Supply side' },
      { id: 'demand_side', title: 'Demand side' },
      { id: 'matching', title: 'Matching mechanics' },
      { id: 'payments', title: 'Payments' },
      { id: 'trust_safety', title: 'Trust and safety' },
      { id: 'take_rate', title: 'Take rate' },
      { id: 'success_metrics', title: 'Success metrics' },
    ],
    clarifyHints: [
      'Which side is harder to acquire — supply or demand? Why?',
      'How does matching happen (algorithm, search, manual)?',
      'What is the take rate and at which moment do you charge?',
    ],
    content: {
      title: 'Marketplace two-sided — standard PRD skeleton',
      version_summary: 'PRD skeleton for a two-sided marketplace at seed stage.',
      sections: [
        section('executive_summary', 'Executive summary', 'Marketplace thesis, current liquidity, ask.'),
        section('supply_side', 'Supply side', 'Who supplies, how they onboard, retention loops.'),
        section('demand_side', 'Demand side', 'Who buys, acquisition channels, repeat behavior.'),
        section('matching', 'Matching mechanics', 'How supply meets demand — search, algorithm, manual.'),
        section('payments', 'Payments', 'Payment flow, escrow, payout cadence.'),
        section('trust_safety', 'Trust and safety', 'Reviews, dispute resolution, KYC.'),
        section('take_rate', 'Take rate', 'Take rate model and tier logic.'),
        section('success_metrics', 'Success metrics', 'GMV, take rate %, repeat purchase rate.'),
      ],
    },
  },
  {
    slug: 'ai-developer-tool',
    title: 'AI developer tool',
    description:
      'Standard PRD skeleton for an AI-powered developer tool — model selection, latency budget, token economics, evals, security posture for code data.',
    category: 'prd-skeleton',
    journeyHint: 'standard',
    sector: 'AI',
    author: 'zedos-official',
    forkCount: 0,
    sectionsOutline: [
      { id: 'executive_summary', title: 'Executive summary' },
      { id: 'developer_persona', title: 'Developer persona' },
      { id: 'model_strategy', title: 'Model strategy' },
      { id: 'latency_budget', title: 'Latency budget' },
      { id: 'token_economics', title: 'Token economics' },
      { id: 'evals', title: 'Evals' },
      { id: 'code_data_security', title: 'Code data security' },
      { id: 'success_metrics', title: 'Success metrics' },
    ],
    clarifyHints: [
      'Which language and which IDE/editor matter most on day one?',
      'What is your latency budget per request (p50 / p95)?',
      'How do users opt out of having their code used for evals?',
    ],
    content: {
      title: 'AI developer tool — standard PRD skeleton',
      version_summary: 'PRD skeleton for an AI-assisted dev tool — eval-driven, latency-aware.',
      sections: [
        section('executive_summary', 'Executive summary', 'What the tool does, who it is for, why now.'),
        section('developer_persona', 'Developer persona', 'Seniority, stack, daily workflow.'),
        section('model_strategy', 'Model strategy', 'Provider, fine-tuning posture, fallback.'),
        section('latency_budget', 'Latency budget', 'Target p50 and p95 per interaction.'),
        section('token_economics', 'Token economics', 'Tokens per session, cost per active user, cache strategy.'),
        section('evals', 'Evals', 'Eval datasets, regression guardrails.'),
        section('code_data_security', 'Code data security', 'PII redaction, opt-out, retention.'),
        section('success_metrics', 'Success metrics', 'Acceptance rate, time-to-first-suggestion, retention.'),
      ],
    },
  },
  {
    slug: 'mobile-consumer-app',
    title: 'Mobile consumer app',
    description:
      'Standard PRD skeleton for a mobile consumer app — install funnel, day-1 activation, push strategy, app-store positioning.',
    category: 'prd-skeleton',
    journeyHint: 'standard',
    sector: 'Consumer',
    author: 'zedos-official',
    forkCount: 0,
    sectionsOutline: [
      { id: 'executive_summary', title: 'Executive summary' },
      { id: 'user_persona', title: 'User persona' },
      { id: 'install_funnel', title: 'Install funnel' },
      { id: 'day_1_activation', title: 'Day-1 activation' },
      { id: 'push_strategy', title: 'Push strategy' },
      { id: 'app_store_positioning', title: 'App store positioning' },
      { id: 'monetization', title: 'Monetization' },
      { id: 'success_metrics', title: 'Success metrics' },
    ],
    clarifyHints: [
      'What is the "aha" moment users must hit in the first session?',
      'What permissions do you need on day 1 and what can wait?',
      'Is this iOS-first, Android-first, or cross-platform from day 1?',
    ],
    content: {
      title: 'Mobile consumer app — standard PRD skeleton',
      version_summary: 'PRD skeleton tuned for a consumer mobile app.',
      sections: [
        section('executive_summary', 'Executive summary', 'App pitch, target audience, distribution plan.'),
        section('user_persona', 'User persona', 'One persona — daily life, context of use.'),
        section('install_funnel', 'Install funnel', 'Discovery → install → first open → activation.'),
        section('day_1_activation', 'Day-1 activation', 'Definition of activation + measurement.'),
        section('push_strategy', 'Push strategy', 'Opt-in moment, frequency, payload categories.'),
        section('app_store_positioning', 'App store positioning', 'Category, screenshots story, keyword angle.'),
        section('monetization', 'Monetization', 'Free, paywall, IAP, subscription mix.'),
        section('success_metrics', 'Success metrics', 'D1 / D7 / D30 retention, ARPU, virality.'),
      ],
    },
  },
  {
    slug: 'investor-dataroom-lite',
    title: 'Investor dataroom lite',
    description:
      'Express one-pager pack for fundraising — vision, traction, team, ask. Pairs with the Stakeholder one-pager templates.',
    category: 'one-pager-pack',
    journeyHint: 'express',
    sector: 'Fundraising',
    author: 'zedos-official',
    forkCount: 0,
    sectionsOutline: [
      { id: 'vision', title: 'Vision' },
      { id: 'traction', title: 'Traction' },
      { id: 'team', title: 'Team' },
      { id: 'ask', title: 'Ask' },
    ],
    clarifyHints: [
      'In one sentence, what makes this investable now?',
      'Pick the 3 numbers that show traction is real.',
      'How much are you raising and what does it unlock?',
    ],
    content: {
      title: 'Investor dataroom lite — express one-pager pack',
      version_summary: 'Four-section dataroom one-pager for first-meeting investor conversations.',
      sections: [
        section('vision', 'Vision', 'Problem, insight, opportunity in 3 lines.'),
        section('traction', 'Traction', '3 numbers that prove the thing is moving.'),
        section('team', 'Team', 'Founders + unfair advantage in 3 lines.'),
        section('ask', 'Ask', 'Round size, dilution, what 18 months of runway unlocks.'),
      ],
    },
  },
  {
    slug: 'pivot-this-week',
    title: 'Pivot this week',
    description:
      'Express playbook to test a new direction quickly — restate the problem, narrow the segment, ship a single proof-point experiment in 5 days.',
    category: 'playbook',
    journeyHint: 'express',
    sector: 'Generic',
    author: 'zedos-official',
    forkCount: 0,
    sectionsOutline: [
      { id: 'restated_problem', title: 'Restated problem' },
      { id: 'narrowed_segment', title: 'Narrowed segment' },
      { id: 'proof_experiment', title: 'Proof experiment' },
      { id: 'kill_criteria', title: 'Kill criteria' },
      { id: 'timeline', title: '5-day timeline' },
    ],
    clarifyHints: [
      'Why is the current direction not working — what evidence?',
      'Which 1 segment do you bet on and why?',
      'What experiment, in 5 days, would prove or kill the new direction?',
    ],
    content: {
      title: 'Pivot this week — express playbook',
      version_summary: 'Five-section playbook to design and ship a 5-day pivot experiment.',
      sections: [
        section('restated_problem', 'Restated problem', 'What you now believe the real problem is.'),
        section('narrowed_segment', 'Narrowed segment', 'The single segment you will test against.'),
        section('proof_experiment', 'Proof experiment', 'What you build / fake / sell to test it.'),
        section('kill_criteria', 'Kill criteria', 'Numbers below which you stop the pivot.'),
        section('timeline', '5-day timeline', 'Day-by-day plan to ship + measure.'),
      ],
    },
  },
  {
    slug: 'import-chatgpt-cleanup',
    title: 'Import ChatGPT cleanup',
    description:
      'Import an existing PRD draft from ChatGPT, Notion, or Google Docs and turn it into a structured Zedos PRD with consistent section IDs and open questions surfaced.',
    category: 'import-guide',
    journeyHint: 'import',
    sector: 'Generic',
    author: 'zedos-official',
    forkCount: 0,
    sectionsOutline: [
      { id: 'imported_content', title: 'Imported content' },
      { id: 'cleanup_checklist', title: 'Cleanup checklist' },
      { id: 'open_questions', title: 'Open questions' },
    ],
    clarifyHints: [
      'Paste your draft as-is — Zedos will normalize the section structure.',
      'Mark sections you trust vs sections that need revisiting.',
      'List the 3 most important open questions your draft does not answer yet.',
    ],
    content: {
      title: 'Import ChatGPT cleanup — import guide',
      version_summary:
        'Wrap an imported draft, surface a cleanup checklist, and explicitly list open questions.',
      sections: [
        section(
          'imported_content',
          'Imported content',
          'Paste your existing PRD (ChatGPT / Notion / docs) into this section.',
          'low',
          ['Replace this placeholder with your imported content.']
        ),
        section('cleanup_checklist', 'Cleanup checklist', 'Tick: consistent section IDs, no PII, no placeholder lorem.'),
        section('open_questions', 'Open questions', 'Top 3 open questions extracted from the draft.'),
      ],
    },
  },
  {
    slug: 'cursor-handoff-only',
    title: 'Cursor handoff only',
    description:
      'Post-PRD template for teams that already have a PRD and want a clean handoff package to Cursor (feature split, user stories, task split, delivery export).',
    category: 'post-prd',
    journeyHint: 'standard',
    sector: 'DevTools',
    author: 'zedos-official',
    forkCount: 0,
    sectionsOutline: [
      { id: 'context_snapshot', title: 'Context snapshot' },
      { id: 'feature_split_seed', title: 'Feature split seed' },
      { id: 'delivery_targets', title: 'Delivery targets' },
    ],
    clarifyHints: [
      'Paste a short context snapshot — what is the codebase, what already exists?',
      'List the first 3 feature clusters you would hand off.',
      'Which delivery targets matter — backend, web, mobile, infra?',
    ],
    content: {
      title: 'Cursor handoff only — post-PRD template',
      version_summary: 'Minimal PRD-side seed used as an anchor for the post-PRD pipeline.',
      sections: [
        section('context_snapshot', 'Context snapshot', 'One paragraph of repo context, languages, frameworks.'),
        section('feature_split_seed', 'Feature split seed', '3 feature clusters to anchor the split.'),
        section('delivery_targets', 'Delivery targets', 'Backend / web / mobile / infra — what you will ship first.'),
      ],
    },
  },
  {
    slug: 'fr-pitch-demain',
    title: 'FR pitch demain',
    description:
      'Playbook express en français — version 24h pour préparer un pitch investisseur, advisor ou accélérateur avec un livrable partageable.',
    category: 'playbook',
    journeyHint: 'express',
    sector: 'FR',
    author: 'zedos-official',
    forkCount: 0,
    sectionsOutline: [
      { id: 'resume_executif', title: 'Résumé exécutif' },
      { id: 'vision', title: 'Vision' },
      { id: 'utilisateurs_cibles', title: 'Utilisateurs cibles' },
      { id: 'fonctionnalites_cles', title: 'Fonctionnalités clés' },
      { id: 'parcours_utilisateur', title: 'Parcours utilisateur' },
      { id: 'technique', title: 'Technique' },
      { id: 'metriques', title: 'Métriques de succès' },
      { id: 'business_model', title: 'Business model' },
      { id: 'differenciation', title: 'Différenciation' },
      { id: 'roadmap', title: 'Roadmap 90 jours' },
      { id: 'hors_perimetre', title: 'Hors périmètre' },
      { id: 'risques', title: 'Risques' },
    ],
    clarifyHints: [
      'En une phrase : quel problème tu résous, et pour qui ?',
      'Qui paie vs qui utilise au quotidien ?',
      'Quelles 3 fonctionnalités tu démontres demain matin ?',
    ],
    content: {
      title: 'FR pitch demain — modèle express',
      version_summary:
        'Modèle express 12 sections pour préparer un pitch investisseur en 24h (FR).',
      sections: [
        section('resume_executif', 'Résumé exécutif', 'Cinq lignes max : quoi, pour qui, traction, demande.'),
        section('vision', 'Vision', 'Problème (1 phrase) + insight (1 phrase).'),
        section('utilisateurs_cibles', 'Utilisateurs cibles', 'Un persona — métier, douleur, fréquence.'),
        section('fonctionnalites_cles', 'Fonctionnalités clés', '3 bullets MVP.'),
        section('parcours_utilisateur', 'Parcours utilisateur', 'Un happy path en 4-6 étapes.'),
        section('technique', 'Technique', 'Stack en 3 bullets.'),
        section('metriques', 'Métriques de succès', '2 métriques sur 90 jours.'),
        section('business_model', 'Business model', 'Comment tu gagnes de l’argent.'),
        section('differenciation', 'Différenciation', 'vs 1 concurrent nommé.'),
        section('roadmap', 'Roadmap 90 jours', 'Jalons sur 90 jours.'),
        section('hors_perimetre', 'Hors périmètre', '3 non-goals honnêtes.'),
        section('risques', 'Risques', '2 risques + mitigation.'),
      ],
    },
  },
] satisfies TemplateDetail[]);
