import { ArrowDown, ArrowUpRight, Check } from 'lucide-react';
import { MarketingContainer } from './landing-primitives';
import { TrackedLink } from './landing-analytics';
import { HeroProductPreview } from './hero-product-preview';
import type { LandingCopy } from './landing-copy';

export function HeroSection({ copy }: { copy: LandingCopy['hero'] }) {
  return (
    <section className="marketing-grid relative overflow-hidden pb-20 pt-24 sm:pb-28 sm:pt-36 lg:pb-32 lg:pt-32">
      <span
        aria-hidden="true"
        className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-studio-sage/30 blur-3xl"
      />
      <span
        aria-hidden="true"
        className="absolute -left-28 bottom-12 h-64 w-64 rounded-full bg-studio-clay/10 blur-3xl"
      />
      <MarketingContainer className="relative grid items-center gap-14 xl:grid-cols-[1.05fr_0.95fr] xl:gap-12">
        <div>
          <p className="mb-6 inline-flex min-h-8 items-center gap-2 rounded-full border border-studio-ink/10 bg-white/70 px-3 text-xs font-semibold uppercase tracking-widest text-studio-forest shadow-studio-sm">
            <span className="h-2 w-2 rounded-full bg-studio-clay" aria-hidden="true" />
            {copy.eyebrow}
          </p>
          <h1 className="text-balance font-editorial text-4xl font-medium leading-[0.95] tracking-tight text-studio-ink xs:text-5xl sm:text-6xl lg:text-7xl">
            {copy.titleStart}
            <em className="font-normal text-studio-forest">
              {copy.titleEmphasis}
            </em>
            {copy.titleEnd}
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-studio-muted sm:text-xl sm:leading-8">
            <span className="sm:hidden">{copy.mobileBody}</span>
            <span className="hidden sm:inline">{copy.desktopBody}</span>
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              href="#early-access"
              placement="hero_primary"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-studio-ink px-6 text-base font-semibold text-white shadow-studio-md transition-transform hover:-translate-y-0.5 hover:bg-studio-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay focus-visible:ring-offset-2"
            >
              {copy.primaryCta}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
            <TrackedLink
              href="#how-it-works"
              placement="hero_secondary"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-studio-ink/15 bg-white/70 px-6 text-base font-semibold text-studio-ink transition-colors hover:border-studio-ink/30 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay"
            >
              {copy.secondaryCta}
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
          </div>
          <ul className="mt-7 grid gap-2 text-sm text-studio-muted sm:grid-cols-2">
            {copy.trustPoints.map((point) => (
              <TrustPoint key={point}>{point}</TrustPoint>
            ))}
          </ul>
        </div>
        <HeroProductPreview copy={copy.preview} />
      </MarketingContainer>
    </section>
  );
}

function TrustPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-studio-sage/40 text-studio-forest">
        <Check className="h-3 w-3" aria-hidden="true" />
      </span>
      {children}
    </li>
  );
}
