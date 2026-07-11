import { Check, X } from 'lucide-react';
import { bestFit, earlyAccessValue } from './landing-content';
import { MarketingContainer } from './landing-primitives';
import { WaitlistForm } from './waitlist-form';

export function EarlyAccessSection() {
  return (
    <section
      id="early-access"
      className="scroll-mt-16 bg-studio-ink py-20 sm:py-28 lg:py-32"
      aria-labelledby="early-access-title"
    >
      <MarketingContainer>
        <div className="grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-sage">
              Founder-led early access
            </p>
            <h2
              id="early-access-title"
              className="mt-4 text-balance font-editorial text-5xl font-medium leading-none text-white sm:text-6xl"
            >
              Bring us the stack you want to stop managing.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
              Apply for a practical review of your website and booking setup. If there
              is a fit for the current pilot, we will map what Zedos could unify now,
              what should stay in place, and what can come later.
            </p>

            <ul className="mt-8 space-y-3">
              {earlyAccessValue.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-white/80">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-studio-sage/20 text-studio-sage">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <FitCard title="Best fit" items={bestFit} />
              <FitCard
                title="Probably too early"
                items={[
                  'You only need a free template site',
                  'A large product catalogue is the core business',
                  'You need an instant self-serve launch today',
                ]}
                negative
              />
            </div>
          </div>
          <WaitlistForm />
        </div>
      </MarketingContainer>
    </section>
  );
}

function FitCard({
  title,
  items,
  negative = false,
}: {
  title: string;
  items: readonly string[];
  negative?: boolean;
}) {
  const Icon = negative ? X : Check;
  return (
    <aside className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs leading-5 text-white/55">
            <Icon
              className={negative ? 'mt-0.5 h-3.5 w-3.5 text-white/35' : 'mt-0.5 h-3.5 w-3.5 text-studio-sage'}
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}
