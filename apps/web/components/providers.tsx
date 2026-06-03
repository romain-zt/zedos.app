'use client'

import { I18nProvider } from '@/src/i18n'
import { PostHogIdentify } from '@/lib/posthog-identify'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider initialLocale="fr">
      <PostHogIdentify />
      {children}
    </I18nProvider>
  )
}
