import { Boxes, Code2, Database, ExternalLink, Users } from 'lucide-react';
import { ownershipCommitments } from './landing-content';
import { MarketingContainer, SectionIntro } from './landing-primitives';

const ownershipIcons = [Code2, Database, Users, Boxes] as const;

export function OwnershipSection() {
  return (
    <section
      id="why-zedos"
      className="scroll-mt-20 overflow-hidden bg-studio-forest py-20 sm:py-28 lg:py-32"
      aria-labelledby="ownership-title"
    >
      <MarketingContainer>
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <SectionIntro
              eyebrow="No dead end"
              title="Start simple. Keep every option open."
              titleId="ownership-title"
              body="Most easy tools become restrictive when your business no longer fits their template. Zedos is built on a real codebase and database that your business can keep, extend, or hand to another team."
              inverse
            />
            <p className="mt-8 border-l-2 border-studio-clay pl-5 font-editorial text-2xl leading-snug text-white sm:text-3xl">
              If Zedos stops being the best team to run it, you should still keep the
              asset.
            </p>
          </div>

          <div className="relative">
            <span
              aria-hidden="true"
              className="absolute bottom-10 left-10 top-10 w-px bg-white/10 sm:left-1/2"
            />
            <div className="relative mb-4 rounded-2xl border border-studio-sage/30 bg-studio-sage/15 p-5 text-white sm:mx-auto sm:max-w-sm sm:text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-studio-sage">
                The asset belongs with
              </p>
              <p className="mt-2 font-display text-xl font-semibold">Your business</p>
            </div>

            <ul className="relative grid gap-3 sm:grid-cols-2">
              {ownershipCommitments.map((item, index) => {
                const Icon = ownershipIcons[index] ?? Code2;
                return (
                  <li
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-studio-ink/55 p-5 backdrop-blur-sm"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-studio-sage">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">{item.body}</p>
                  </li>
                );
              })}
            </ul>

            <details className="relative mt-4 rounded-2xl border border-white/10 bg-white/5 text-white">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-studio-sage">
                See the standard technology underneath
                <ExternalLink className="h-4 w-4 text-studio-sage" aria-hidden="true" />
              </summary>
              <div className="border-t border-white/10 px-5 py-5">
                <p className="text-sm leading-6 text-white/65">
                  The product direction uses technologies such as Next.js, TypeScript,
                  PostgreSQL, standard Git repositories, and a modular CMS architecture.
                  These details are optional for owners and useful for developers.
                </p>
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Technology examples">
                  {['Next.js', 'TypeScript', 'PostgreSQL', 'Git', 'Modular CMS'].map(
                    (technology) => (
                      <li
                        key={technology}
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/70"
                      >
                        {technology}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </details>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}
