import { ArrowRight, Check, Handshake } from 'lucide-react';
import { MarketingContainer, SectionIntro } from './landing-primitives';
import { classNames } from './class-names';
import type { LandingCopy } from './landing-copy';

export function ComparisonSection({
  copy,
}: {
  copy: LandingCopy['comparison'];
}) {
  return (
    <section
      className="bg-studio-paper py-20 sm:py-28 lg:py-32"
      aria-labelledby="comparison-title"
    >
      <MarketingContainer>
        <SectionIntro
          eyebrow={copy.eyebrow}
          title={copy.title}
          titleId="comparison-title"
          body={copy.body}
        />

        <div className="mt-12 grid gap-3 md:grid-cols-2">
          {copy.items.map((item) => (
            <article
              key={item.name}
              className={classNames(
                'rounded-2xl border p-5 sm:p-6',
                item.featured
                  ? 'border-studio-forest bg-studio-ink text-white shadow-studio-lg'
                  : 'border-studio-ink/10 bg-studio-canvas text-studio-ink'
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-lg font-semibold">{item.name}</h3>
                {item.featured ? (
                  <span className="rounded-full bg-studio-sage/20 px-3 py-1 text-xs font-semibold text-studio-sage">
                    {copy.featuredLabel}
                  </span>
                ) : null}
              </div>
              <dl className="mt-8 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt
                    className={classNames(
                      'text-xs font-semibold uppercase tracking-widest',
                      item.featured ? 'text-studio-sage' : 'text-studio-forest'
                    )}
                  >
                    {copy.strengthLabel}
                  </dt>
                  <dd className="mt-2 text-sm leading-6">{item.strength}</dd>
                </div>
                <div>
                  <dt
                    className={classNames(
                      'text-xs font-semibold uppercase tracking-widest',
                      item.featured ? 'text-studio-clay-light' : 'text-studio-clay-dark'
                    )}
                  >
                    {copy.tradeoffLabel}
                  </dt>
                  <dd
                    className={classNames(
                      'mt-2 text-sm leading-6',
                      item.featured ? 'text-white/65' : 'text-studio-muted'
                    )}
                  >
                    {item.tradeoff}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <p className="mt-8 max-w-4xl text-sm leading-6 text-studio-muted">
          <strong className="text-studio-ink">{copy.caveatLabel}</strong>{' '}
          {copy.caveatBody}
        </p>
      </MarketingContainer>
    </section>
  );
}

export function PilotTrustSection({ copy }: { copy: LandingCopy['pilot'] }) {
  return (
    <section
      className="bg-studio-canvas py-20 sm:py-28 lg:py-32"
      aria-labelledby="pilot-title"
    >
      <MarketingContainer>
        <article className="overflow-hidden rounded-3xl border border-studio-ink/10 bg-studio-rose/45 shadow-studio-md">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="flex min-h-80 flex-col justify-between bg-studio-clay p-6 text-white sm:p-10">
              <span className="grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/10 font-editorial text-2xl">
                {copy.initials}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/65">
                  {copy.label}
                </p>
                <p className="mt-3 font-editorial text-4xl font-medium">
                  {copy.name}
                </p>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">
                  {copy.shortDescription}
                </p>
              </div>
            </aside>
            <div className="p-6 sm:p-10 lg:p-14">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-studio-forest">
                <Handshake className="h-4 w-4" aria-hidden="true" />
                {copy.eyebrow}
              </p>
              <h2
                id="pilot-title"
                className="mt-5 max-w-2xl font-editorial text-4xl font-medium leading-none text-studio-ink sm:text-5xl"
              >
                {copy.title}
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-studio-muted">
                {copy.body}
              </p>
              <ul className="mt-7 grid gap-3 text-sm text-studio-ink sm:grid-cols-2">
                {copy.points.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-studio-forest" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <blockquote className="mt-9 border-l-2 border-studio-clay pl-5">
                <p className="font-editorial text-2xl leading-snug text-studio-ink">
                  “{copy.quote}”
                </p>
                <footer className="mt-3 flex items-center gap-2 text-sm font-semibold text-studio-muted">
                  {copy.signature}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </footer>
              </blockquote>
            </div>
          </div>
        </article>
      </MarketingContainer>
    </section>
  );
}
