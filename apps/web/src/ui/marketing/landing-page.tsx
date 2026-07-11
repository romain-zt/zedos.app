import { LandingAnalytics } from './landing-analytics';
import { SiteHeader } from './site-header';
import { HeroSection } from './hero-section';
import {
  BookingJourneySection,
  ProblemSection,
} from './problem-and-journey';
import { ExecutionSection } from './execution-section';
import { OwnershipSection } from './ownership-section';
import {
  ComparisonSection,
  PilotTrustSection,
} from './comparison-and-trust';
import { EarlyAccessSection } from './early-access-section';
import { FaqSection, SiteFooter } from './faq-and-footer';
import {
  getLandingCopy,
  type MarketingLocale,
} from './landing-copy';

export function LandingPage({ locale }: { locale: MarketingLocale }) {
  const copy = getLandingCopy(locale);

  return (
    <div className="marketing-shell min-h-screen bg-studio-canvas text-studio-ink">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-full bg-studio-ink px-5 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-studio-clay"
      >
        {copy.accessibility.skipToContent}
      </a>
      <LandingAnalytics />
      <SiteHeader locale={locale} copy={copy} />
      <main id="main-content">
        <HeroSection copy={copy.hero} />
        <ProblemSection copy={copy.problem} />
        <BookingJourneySection copy={copy.journey} />
        <ExecutionSection copy={copy.execution} />
        <OwnershipSection copy={copy.ownership} />
        <ComparisonSection copy={copy.comparison} />
        <PilotTrustSection copy={copy.pilot} />
        <EarlyAccessSection locale={locale} copy={copy} />
        <FaqSection copy={copy.faq} />
      </main>
      <SiteFooter locale={locale} copy={copy} />
    </div>
  );
}
