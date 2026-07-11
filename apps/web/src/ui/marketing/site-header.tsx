import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { MarketingContainer, ZedosLogo } from './landing-primitives';
import { TrackedLink } from './landing-analytics';
import type { LandingCopy, MarketingLocale } from './landing-copy';

export function SiteHeader({
  locale,
  copy,
}: {
  locale: MarketingLocale;
  copy: LandingCopy;
}) {
  const alternateLocale = locale === 'fr' ? 'en' : 'fr';
  const navItems = [
    { href: '#how-it-works', label: copy.navigation.howItWorks },
    { href: '#why-zedos', label: copy.navigation.whyZedos },
    { href: '#early-access', label: copy.navigation.earlyAccess },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-studio-ink/10 bg-studio-canvas/90 backdrop-blur-xl">
      <MarketingContainer className="flex h-16 items-center justify-between">
        <ZedosLogo
          href={`/${locale}`}
          ariaLabel={copy.accessibility.logoHome}
        />
        <nav
          aria-label={copy.navigation.primaryLabel}
          className="hidden items-center gap-1 md:flex"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium text-studio-muted transition-colors hover:bg-white/70 hover:text-studio-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <TrackedLink
            href={`/${locale}/sign-in`}
            placement="header_sign_in"
            className="hidden min-h-11 items-center px-3 text-sm font-medium text-studio-muted hover:text-studio-ink focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay xl:inline-flex"
          >
            {copy.navigation.existingPilot}
          </TrackedLink>
          <Link
            href={`/${alternateLocale}`}
            hrefLang={alternateLocale}
            lang={alternateLocale}
            aria-label={copy.navigation.switchLanguage}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold uppercase tracking-wider text-studio-muted hover:bg-white/70 hover:text-studio-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay"
          >
            {alternateLocale}
          </Link>
          <TrackedLink
            href="#early-access"
            placement="header"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-studio-ink px-4 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-studio-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay focus-visible:ring-offset-2 sm:px-5"
          >
            <span className="sm:hidden">{copy.navigation.earlyAccessMobile}</span>
            <span className="hidden sm:inline">{copy.navigation.apply}</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </TrackedLink>
        </div>
      </MarketingContainer>
    </header>
  );
}
