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
import { enMessages, type MessageKey } from './messages/en';
import { frMessages } from './messages/fr';

export type Locale = 'en' | 'fr';

const LOCALE_COOKIE = 'zedos_locale';

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  en: enMessages,
  fr: frMessages,
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => Promise<void>;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readCookieLocale(): Locale {
  if (typeof document === 'undefined') return 'fr';
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match?.[1];
  return value === 'en' ? 'en' : 'fr';
}

export function I18nProvider({
  children,
  initialLocale = 'fr',
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    setLocaleState(readCookieLocale());
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    });
    setLocaleState(next);
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
  }, []);

  const t = useCallback(
    (key: MessageKey) => catalogs[locale][key] ?? catalogs.en[key] ?? key,
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}
