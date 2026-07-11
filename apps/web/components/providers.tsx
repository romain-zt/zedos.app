'use client'

import { I18nProvider, type Locale } from '@/src/i18n'
import { PostHogIdentify } from '@/lib/posthog-identify'

export function Providers({
  children,
  initialLocale,
}: {
  children: React.ReactNode
  initialLocale: Locale
}) {
  return (
    <I18nProvider initialLocale={initialLocale}>
      <PostHogIdentify />
      {children}
    </I18nProvider>
  )
}
