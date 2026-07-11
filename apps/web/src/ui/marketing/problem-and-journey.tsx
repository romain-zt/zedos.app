import {
  ArrowDown,
  ArrowRight,
  CalendarRange,
  CreditCard,
  Globe2,
  PlugZap,
} from 'lucide-react';
import { bookingJourney, fragmentedStack } from './landing-content';
import { MarketingContainer, SectionIntro } from './landing-primitives';

const stackIcons = [Globe2, CalendarRange, CreditCard, PlugZap] as const;

export function ProblemSection() {
  return (
    <section className="bg-studio-ink py-20 sm:py-28 lg:py-32" aria-labelledby="problem-title">
      <MarketingContainer>
        <SectionIntro
          eyebrow="One client journey. Too many systems."
          title="Your customers feel every gap between your tools."
          titleId="problem-title"
          body="They discover you on one site, book in another, pay through a third, and receive reminders from somewhere else. You manage every handoff—and wait on a plugin, provider, or agency whenever the business changes."
          inverse
        />

        <ol className="mt-14 grid gap-3 lg:grid-cols-4">
          {fragmentedStack.map((item, index) => {
            const Icon = stackIcons[index] ?? Globe2;
            return (
              <li key={item.title} className="relative">
                <article className="h-full rounded-2xl border border-white/10 bg-white/5 p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-studio-sage">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-6 text-xs font-medium text-white/45">0{index + 1}</p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm text-white/60">{item.description}</p>
                  <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-studio-sage">
                    {item.friction}
                  </p>
                </article>
                {index < fragmentedStack.length - 1 ? (
                  <>
                    <ArrowDown
                      className="mx-auto my-1 h-5 w-5 text-white/30 lg:hidden"
                      aria-hidden="true"
                    />
                    <ArrowRight
                      className="absolute -right-4 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-white/30 lg:block"
                      aria-hidden="true"
                    />
                  </>
                ) : null}
              </li>
            );
          })}
        </ol>

        <p className="mx-auto mt-12 max-w-3xl text-center font-editorial text-2xl leading-snug text-white/85 sm:text-3xl">
          The problem is not one bad tool. It is a customer experience no one system
          truly owns.
        </p>
      </MarketingContainer>
    </section>
  );
}

export function BookingJourneySection() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-studio-paper py-20 sm:py-28 lg:py-32"
      aria-labelledby="journey-title"
    >
      <MarketingContainer>
        <SectionIntro
          eyebrow="Designed as one journey"
          title="From first visit to the next booking."
          titleId="journey-title"
          body="Zedos is being built around how reservation-led wellness businesses actually work—not around the limits of a page template or booking widget."
        />

        <ol className="relative mt-14 grid gap-3 sm:grid-cols-5">
          <span
            className="absolute left-8 right-8 top-7 hidden h-px bg-studio-ink/15 sm:block"
            aria-hidden="true"
          />
          {bookingJourney.map((item) => (
            <li
              key={item.step}
              className="relative grid grid-cols-[3.5rem_1fr] items-center gap-3 rounded-2xl border border-studio-ink/10 bg-studio-canvas p-4 sm:block sm:border-0 sm:bg-transparent sm:p-0"
            >
              <span className="relative z-10 grid h-14 w-14 place-items-center rounded-full border border-studio-ink/15 bg-studio-canvas font-mono text-xs font-semibold text-studio-forest shadow-studio-sm">
                {item.step}
              </span>
              <span className="sm:mt-5 sm:block">
                <strong className="block font-display text-base text-studio-ink">
                  {item.label}
                </strong>
                <span className="mt-1 block text-sm leading-5 text-studio-muted">
                  {item.detail}
                </span>
              </span>
            </li>
          ))}
        </ol>

        <aside className="mt-12 rounded-2xl border border-studio-forest/20 bg-studio-sage/20 p-5 text-sm leading-6 text-studio-ink sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-6">
          <p className="font-semibold">Early-access scope is agreed with each pilot.</p>
          <p className="mt-2 max-w-2xl text-studio-muted sm:mt-0">
            We keep proven tools in place until a Zedos workflow is ready for the way
            your business actually operates.
          </p>
        </aside>
      </MarketingContainer>
    </section>
  );
}
