'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

export type Locale = 'en' | 'fr';

const LOCALE_COOKIE = 'zedos_locale';

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => Promise<void>;
  t: (key: string) => string;
  tp: (key: string, fallback: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readCookieLocale(): Locale {
  if (typeof document === 'undefined') return 'fr';
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1];
  return value === 'en' ? 'en' : 'fr';
}

function readPathLocale(pathname: string | null): Locale | null {
  if (!pathname) return null;
  if (pathname === '/fr' || pathname.startsWith('/fr/')) return 'fr';
  if (pathname === '/en' || pathname.startsWith('/en/')) return 'en';
  return null;
}

function normalizePathWithoutLocale(pathname: string | null): string {
  if (!pathname || pathname === '/') return '/';
  if (pathname === '/fr' || pathname === '/en') return '/';
  if (pathname.startsWith('/fr/')) return pathname.slice(3) || '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return pathname;
}

function pathMatchesRoute(pathname: string, route: string): boolean {
  const pathnameSegments = pathname.split('/').filter(Boolean);
  const routeSegments = route.split('/').filter(Boolean);
  if (pathnameSegments.length != routeSegments.length) return false;

  return routeSegments.every((segment, index) => {
    const current = pathnameSegments[index] ?? '';
    const isDynamic = segment.startsWith('[') && segment.endsWith(']');
    return isDynamic ? current.length > 0 : segment === current;
  });
}

const PAGE_ROUTE_TO_SLUG: Array<{ route: string; slug: string }> = [
  { route: '/', slug: 'home' },
  { route: '/login', slug: 'login' },
  { route: '/dashboard', slug: 'dashboard' },
  { route: '/sign-in', slug: 'sign-in' },
  { route: '/dashboard/credits', slug: 'dashboard_credits' },
  { route: '/dashboard/billing', slug: 'dashboard_billing' },
  { route: '/dashboard/projects/[id]/user-stories/[clusterId]', slug: 'dashboard_projects_id_user-stories_clusterId' },
  { route: '/dashboard/projects', slug: 'dashboard_projects' },
  { route: '/dashboard/projects/[id]/user-stories', slug: 'dashboard_projects_id_user-stories' },
  { route: '/signup', slug: 'signup' },
  { route: '/reset-password', slug: 'reset-password' },
  { route: '/dashboard/settings', slug: 'dashboard_settings' },
  { route: '/dashboard/projects/[id]/delivery', slug: 'dashboard_projects_id_delivery' },
  { route: '/sign-up', slug: 'sign-up' },
  { route: '/legal/privacy', slug: 'legal_privacy' },
  { route: '/dashboard/projects/[id]/feature-split', slug: 'dashboard_projects_id_feature-split' },
  { route: '/legal/terms', slug: 'legal_terms' },
  { route: '/share/[token]', slug: 'share_token' },
  { route: '/dashboard/projects/[id]', slug: 'dashboard_projects_id' },
  { route: '/forgot-password', slug: 'forgot-password' },
  { route: '/dashboard/projects/[id]/task-split', slug: 'dashboard_projects_id_task-split' },
];

function resolvePageSlug(pathname: string | null): string | null {
  const normalizedPath = normalizePathWithoutLocale(pathname);
  const match = PAGE_ROUTE_TO_SLUG.find(({ route }) => pathMatchesRoute(normalizedPath, route));
  return match?.slug ?? null;
}

function sanitizeMessageRecord(
  data: Record<string, string | number | boolean | null | object>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      out[key] = value;
    }
  }
  return out;
}

export function I18nProvider({
  children,
  initialLocale = 'fr',
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const pathname = usePathname();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [commonCopy, setCommonCopy] = useState<Record<string, string>>({});
  const [pageCopy, setPageCopy] = useState<Record<string, string>>({});

  useEffect(() => {
    const fromPath = readPathLocale(pathname);
    if (fromPath) {
      setLocaleState(fromPath);
      document.cookie = `${LOCALE_COOKIE}=${fromPath};path=/;max-age=31536000;samesite=lax`;
      return;
    }
    setLocaleState(readCookieLocale());
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const loadCommonCopy = async (): Promise<void> => {
      try {
        const response = await fetch(`/messages/${locale}/common.json`, { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) setCommonCopy({});
          return;
        }
        const json = (await response.json()) as Record<string, string | number | boolean | null | object>;
        if (!cancelled) {
          setCommonCopy(sanitizeMessageRecord(json));
        }
      } catch {
        if (!cancelled) setCommonCopy({});
      }
    };
    void loadCommonCopy();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    const slug = resolvePageSlug(pathname);
    if (!slug) {
      setPageCopy({});
      return;
    }

    let cancelled = false;
    const loadPageCopy = async (): Promise<void> => {
      try {
        const response = await fetch(`/messages/${locale}/${slug}.json`, { cache: 'no-store' });
        if (!response.ok) {
          if (!cancelled) setPageCopy({});
          return;
        }
        const json = (await response.json()) as Record<string, string | number | boolean | null | object>;
        if (!cancelled) {
          setPageCopy(sanitizeMessageRecord(json));
        }
      } catch {
        if (!cancelled) setPageCopy({});
      }
    };

    void loadPageCopy();
    return () => {
      cancelled = true;
    };
  }, [locale, pathname]);

  const setLocale = useCallback(async (next: Locale) => {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    });
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
  }, []);

  const t = useCallback((key: string) => commonCopy[key] ?? key, [commonCopy]);

  const tp = useCallback((key: string, fallback: string) => {
    const value = pageCopy[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
    return fallback;
  }, [pageCopy]);

  const value = useMemo(() => ({ locale, setLocale, t, tp }), [locale, setLocale, t, tp]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
