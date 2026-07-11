import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { requireSession } from '@repo/auth/guards'
import { LandingPage } from '@/src/ui/marketing/landing-page'
import { MarketingAnalyticsBridge } from '@/app/_components/marketing-analytics-bridge'

export const metadata: Metadata = {
  title: 'Website & Booking Platform for Wellness Studios | Zedos',
  description:
    'Launch a branded website and booking experience that can evolve with your wellness business. Keep control of your code, data, and future.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'A better foundation for your wellness business',
    description:
      'Website, booking, and room to grow—without a closed platform or another rebuild. Apply for founder-led early access to Zedos.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A better foundation for your wellness business',
    description:
      'Website, booking, and room to grow—without a closed platform or another rebuild.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function Home() {
  const sessionResult = await requireSession(await headers())
  if (sessionResult.isOk()) {
    redirect('/dashboard')
  }
  return (
    <>
      <MarketingAnalyticsBridge />
      <LandingPage />
    </>
  )
}
