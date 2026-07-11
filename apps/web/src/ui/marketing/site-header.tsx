import { ArrowUpRight } from 'lucide-react';
import { MarketingContainer, ZedosLogo } from './landing-primitives';
import { TrackedLink } from './landing-analytics';

const navItems = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#why-zedos', label: 'Why Zedos' },
  { href: '#early-access', label: 'Early access' },
] as const;

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-studio-ink/10 bg-studio-canvas/90 backdrop-blur-xl">
      <MarketingContainer className="flex h-16 items-center justify-between">
        <ZedosLogo />
        <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
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
            href="/sign-in"
            placement="header_sign_in"
            className="hidden min-h-11 items-center px-3 text-sm font-medium text-studio-muted hover:text-studio-ink focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay lg:inline-flex"
          >
            Existing pilot? Sign in
          </TrackedLink>
          <TrackedLink
            href="#early-access"
            placement="header"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-studio-ink px-4 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-studio-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay focus-visible:ring-offset-2 sm:px-5"
          >
            <span className="sm:hidden">Early access</span>
            <span className="hidden sm:inline">Apply for early access</span>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </TrackedLink>
        </div>
      </MarketingContainer>
    </header>
  );
}
