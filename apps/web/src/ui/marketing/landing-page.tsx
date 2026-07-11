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

export function LandingPage() {
  return (
    <div className="marketing-shell min-h-screen bg-studio-canvas text-studio-ink">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-full bg-studio-ink px-5 py-3 text-sm font-semibold text-white transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-studio-clay"
      >
        Skip to content
      </a>
      <LandingAnalytics />
      <SiteHeader />
      <main id="main-content">
        <HeroSection />
        <ProblemSection />
        <BookingJourneySection />
        <ExecutionSection />
        <OwnershipSection />
        <ComparisonSection />
        <PilotTrustSection />
        <EarlyAccessSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </div>
  );
}
