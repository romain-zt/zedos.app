'use client';

import { Plus } from 'lucide-react';
import { faqItems } from './landing-content';
import {
  MarketingAnalyticsEvents,
  trackMarketingEvent,
} from './marketing-analytics';

export function FaqList() {
  return (
    <div className="divide-y divide-studio-ink/10 border-y border-studio-ink/10">
      {faqItems.map((item, index) => (
        <details
          key={item.id}
          className="group"
          onToggle={(event) => {
            if (event.currentTarget.open) {
              trackMarketingEvent(MarketingAnalyticsEvents.LANDING_FAQ_OPENED, {
                question: item.id,
              });
            }
          }}
        >
          <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-studio-clay">
            <span className="flex items-baseline gap-4">
              <span className="hidden font-mono text-xs text-studio-clay sm:inline">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-base font-semibold text-studio-ink sm:text-lg">
                {item.question}
              </span>
            </span>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-studio-ink/15 text-studio-ink">
              <Plus
                className="h-4 w-4 transition-transform duration-normal group-open:rotate-45"
                aria-hidden="true"
              />
            </span>
          </summary>
          <p className="max-w-3xl pb-6 text-sm leading-7 text-studio-muted sm:pl-10 sm:text-base">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
