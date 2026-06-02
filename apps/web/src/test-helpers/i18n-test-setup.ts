import { vi } from 'vitest';

const TRANSLATIONS: Record<string, string> = {
  'dashboard.hey': 'Hey',
  'dashboard.goToProjects': 'Go to Projects',
  'common.viewAll': 'View all',
  'settings.title': 'Account settings',
  'settings.privacyConsentSection': 'Privacy consent',
  'settings.activeSessions': 'Active sessions',
  'clarify.comingUp': 'Coming up',
  'clarify.readyToGeneratePrd': 'Ready to generate PRD',
  'refine.title': 'Refine',
  'refine.messageAriaLabel': 'Refinement message',
  'refine.send': 'Send refinement',
  'common.close': 'Close',
  'refine.updatePrdWithThread': 'Update PRD',
};

vi.mock('@/src/i18n', () => ({
  useI18n: () => ({
    locale: 'en' as const,
    setLocale: async () => {},
    t: (key: string) => TRANSLATIONS[key] ?? key,
    tp: (_key: string, fallback: string) => fallback,
  }),
}));
