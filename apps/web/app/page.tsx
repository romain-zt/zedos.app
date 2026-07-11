import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireSession } from '@repo/auth/guards'
import { LandingPage } from '@/src/ui/marketing/landing-page'
import { MarketingAnalyticsBridge } from '@/app/_components/marketing-analytics-bridge'
import {
  getLandingCopy,
  type MarketingLocale,
} from '@/src/ui/marketing/landing-copy'

function localeFromHeaders(requestHeaders: Headers): MarketingLocale {
  return requestHeaders.get('x-zedos-locale') === 'en' ? 'en' : 'fr'
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = localeFromHeaders(await headers())
  const copy = getLandingCopy(locale)
  const canonical = `/${locale}`

  return {
    title: copy.seo.title,
    description: copy.seo.description,
    alternates: {
      canonical,
      languages: {
        'fr-FR': '/fr',
        'en-US': '/en',
        'x-default': '/fr',
      },
    },
    openGraph: {
      type: 'website',
      url: canonical,
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      alternateLocale: locale === 'fr' ? ['en_US'] : ['fr_FR'],
      title: copy.seo.socialTitle,
      description: copy.seo.socialDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: copy.seo.socialTitle,
      description: copy.seo.twitterDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function Home() {
  const requestHeaders = await headers()
  const locale = localeFromHeaders(requestHeaders)
  const sessionResult = await requireSession(requestHeaders)
  if (sessionResult.isOk()) {
    redirect(`/${locale}/dashboard`)
  }
  return (
    <>
      <MarketingAnalyticsBridge />
      <LandingPage locale={locale} />
    </>
  )
}
