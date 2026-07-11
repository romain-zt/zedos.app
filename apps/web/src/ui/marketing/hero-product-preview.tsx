import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  MoreHorizontal,
} from 'lucide-react';
import type { LandingCopy } from './landing-copy';

export function HeroProductPreview({
  copy,
}: {
  copy: LandingCopy['hero']['preview'];
}) {
  return (
    <figure
      className="relative mx-auto w-full max-w-2xl pb-12 pt-3 sm:pb-16 lg:pt-0"
      aria-labelledby="hero-preview-caption"
    >
      <figcaption
        id="hero-preview-caption"
        className="mb-3 flex items-center justify-center gap-2 text-xs font-medium text-studio-muted lg:justify-start"
      >
        <span className="h-2 w-2 rounded-full bg-studio-clay" aria-hidden="true" />
        {copy.caption}
      </figcaption>

      <div className="overflow-hidden rounded-3xl border border-studio-ink/15 bg-white shadow-studio-xl">
        <header className="flex h-11 items-center justify-between border-b border-studio-ink/10 bg-studio-paper px-4">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-studio-clay/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-studio-gold/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-studio-sage" />
          </span>
          <span className="rounded-full border border-studio-ink/10 bg-white px-4 py-1 font-mono text-[10px] text-studio-muted">
            studiojuniper.com
          </span>
          <MoreHorizontal className="h-4 w-4 text-studio-muted" aria-hidden="true" />
        </header>

        <section className="grid min-h-[28rem] bg-studio-rose/35 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="mb-8 font-display text-xs font-semibold uppercase tracking-[0.2em] text-studio-forest">
                {copy.studioName}
              </p>
              <h3 className="max-w-sm font-editorial text-4xl font-medium leading-none text-studio-ink sm:text-5xl">
                {copy.headlineFirst}
                <br />
                {copy.headlineSecond}
              </h3>
              <p className="mt-5 max-w-sm text-sm leading-6 text-studio-muted">
                {copy.description}
              </p>
            </div>
            <span className="mt-10 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-studio-ink px-5 text-sm font-semibold text-white">
              {copy.findClass}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </article>

          <aside className="m-3 rounded-2xl border border-studio-ink/10 bg-white p-4 shadow-studio-sm sm:m-5 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-studio-muted">
                  {copy.date}
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-studio-ink">
                  {copy.chooseClass}
                </p>
              </div>
              <CalendarDays className="h-5 w-5 text-studio-forest" aria-hidden="true" />
            </div>

            <ul className="mt-5 space-y-2.5">
              {copy.slots.map((slot) => (
                <BookingSlot key={slot.time} {...slot} />
              ))}
            </ul>

            <span className="mt-4 flex min-h-11 items-center justify-between rounded-xl bg-studio-ink px-4 text-sm font-semibold text-white">
              {copy.continueWith}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </aside>
        </section>
      </div>

      <aside className="absolute bottom-0 left-3 right-3 rounded-2xl border border-studio-ink/10 bg-studio-canvas p-4 shadow-studio-lg sm:left-auto sm:right-8 sm:w-80">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-studio-sage/50 text-studio-ink">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-studio-ink">
              {copy.workshopReady}
            </p>
            <p className="mt-1 text-xs leading-5 text-studio-muted">
              {copy.workshopDetail}
            </p>
          </div>
          <Clock3 className="ml-auto h-4 w-4 shrink-0 text-studio-muted" aria-hidden="true" />
        </div>
      </aside>
    </figure>
  );
}

function BookingSlot({
  time,
  title,
  detail,
  selected = false,
}: {
  time: string;
  title: string;
  detail: string;
  selected?: boolean;
}) {
  return (
    <li
      className={
        selected
          ? 'rounded-xl border border-studio-forest bg-studio-sage/25 p-3'
          : 'rounded-xl border border-studio-ink/10 bg-studio-paper/70 p-3'
      }
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-semibold text-studio-ink">{time}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-studio-ink">
            {title}
          </span>
          <span className="block truncate text-xs text-studio-muted">{detail}</span>
        </span>
        {selected ? (
          <Check className="ml-auto h-4 w-4 text-studio-forest" aria-hidden="true" />
        ) : null}
      </div>
    </li>
  );
}
