import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono, Newsreader } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/app/_components/chunk-load-error-handler'
import { Providers } from '@/components/providers'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-editorial',
  adjustFontFallback: false,
})

export const dynamic = 'force-dynamic'

export function generateMetadata() {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  return {
    metadataBase: new URL(base),
    title: 'Zedos',
    description: 'A flexible digital foundation for reservation-led wellness businesses.',
    icons: {
      icon: '/favicon.svg',
      shortcut: '/favicon.svg',
    },
    openGraph: {
      title: 'Zedos',
      description: 'A flexible digital foundation for reservation-led wellness businesses.',
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = (await headers()).get('x-zedos-locale') === 'en' ? 'en' : 'fr'

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} ${newsreader.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Providers initialLocale={locale}>
            {children}
            <Toaster />
            <ChunkLoadErrorHandler />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
