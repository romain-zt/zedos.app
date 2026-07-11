import { ArrowRight, Check, Handshake } from 'lucide-react';
import { comparisons } from './landing-content';
import { MarketingContainer, SectionIntro } from './landing-primitives';
import { classNames } from './class-names';

export function ComparisonSection() {
  return (
    <section
      className="bg-studio-paper py-20 sm:py-28 lg:py-32"
      aria-labelledby="comparison-title"
    >
      <MarketingContainer>
        <SectionIntro
          eyebrow="A different trade-off"
          title="Choose the compromise you want to stop making."
          titleId="comparison-title"
          body="There is no perfect platform for every business. The important question is what happens when your needs stop fitting the original tool."
        />

        <div className="mt-12 grid gap-3 md:grid-cols-2">
          {comparisons.map((item) => (
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
                    The Zedos bet
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
                    Strong at
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
                    Trade-off
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
          <strong className="text-studio-ink">The honest caveat:</strong> Zedos is not
          the safest choice for every business today. It is being built for businesses
          that know their next change will not fit neatly inside the current stack.
        </p>
      </MarketingContainer>
    </section>
  );
}

export function PilotTrustSection() {
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
                LB
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-white/65">
                  Founding pilot
                </p>
                <p className="mt-3 font-editorial text-4xl font-medium">Little Biceps</p>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">
                  A real wellness business shaping the first workflows with us.
                </p>
              </div>
            </aside>
            <div className="p-6 sm:p-10 lg:p-14">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-studio-forest">
                <Handshake className="h-4 w-4" aria-hidden="true" />
                Built with a real business, not a demo brief
              </p>
              <h2
                id="pilot-title"
                className="mt-5 max-w-2xl font-editorial text-4xl font-medium leading-none text-studio-ink sm:text-5xl"
              >
                The first pilot starts with Little Biceps.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-studio-muted">
                We are shaping Zedos against the decisions, constraints, and daily
                changes of a real wellness business. Early partners receive the same
                founder-led approach: we map the current stack, identify what can move
                safely, and say plainly what is not ready yet.
              </p>
              <ul className="mt-7 grid gap-3 text-sm text-studio-ink sm:grid-cols-2">
                {[
                  'Real operating constraints',
                  'Direct founder involvement',
                  'Clear capability boundaries',
                  'No forced full-stack migration',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-studio-forest" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <blockquote className="mt-9 border-l-2 border-studio-clay pl-5">
                <p className="font-editorial text-2xl leading-snug text-studio-ink">
                  “Easy tools should not become a dead end.”
                </p>
                <footer className="mt-3 flex items-center gap-2 text-sm font-semibold text-studio-muted">
                  Founder, Zedos
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
