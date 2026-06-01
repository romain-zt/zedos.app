export const enMessages = {
  'nav.dashboard': 'Dashboard',
  'nav.projects': 'Projects',
  'nav.credits': 'Credits',
  'nav.signOut': 'Sign out',
  'locale.label': 'Language',
  'locale.fr': 'Français',
  'locale.en': 'English',
  'credits.title': 'Credits',
  'credits.balance': 'Current Balance',
  'credits.autoReload': 'Enable auto-reload',
  'prd.exportMd': 'Export MD',
  'prd.exportPdf': 'Export PDF',
  'members.title': 'Project members',
  'members.invite': 'Invite by email',
  'members.role': 'Role',
  'score.clarification': 'Clarification',
  'score.architecture': 'Architecture',
} as const;

export type MessageKey = keyof typeof enMessages;
