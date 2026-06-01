'use client'

import { I18nProvider } from '@/src/i18n'

export function Providers({ children }: { children: React.ReactNode }) {
  return <I18nProvider initialLocale="fr">{children}</I18nProvider>
}
