export type AppLocale = 'en' | 'fr';

export function normalizePathWithoutLocale(pathname: string | null): string {
  if (!pathname || pathname === '/') return '/';
  if (pathname === '/fr' || pathname === '/en') return '/';
  if (pathname.startsWith('/fr/')) return pathname.slice(3) || '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return pathname;
}

/** Prefix an app path with the locale segment when missing (e.g. `/dashboard` → `/fr/dashboard`). */
export function localePath(path: string, locale: AppLocale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (
    normalized === '/fr' ||
    normalized === '/en' ||
    normalized.startsWith('/fr/') ||
    normalized.startsWith('/en/')
  ) {
    return normalized;
  }
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}

export function projectIdFromDashboardPath(pathname: string | null): string | null {
  const path = normalizePathWithoutLocale(pathname);
  return path.match(/^\/dashboard\/projects\/([^/]+)/)?.[1] ?? null;
}
