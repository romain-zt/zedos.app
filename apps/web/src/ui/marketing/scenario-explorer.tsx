'use client';

import { useRef, useState, type KeyboardEvent } from 'react';
import {
  ArrowRight,
  Check,
  GitBranch,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react';
import { classNames } from './class-names';
import {
  MarketingAnalyticsEvents,
  trackMarketingEvent,
} from './marketing-analytics';
import type { LandingCopy } from './landing-copy';

const toneClasses = {
  sage: 'bg-studio-sage/30 text-studio-forest',
  clay: 'bg-studio-clay/15 text-studio-clay-dark',
  blue: 'bg-studio-blue/15 text-studio-blue-dark',
} as const;

export function ScenarioExplorer({
  copy,
}: {
  copy: LandingCopy['execution'];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = copy.scenarios[activeIndex] ?? copy.scenarios[0];

  function selectScenario(index: number) {
    const scenario = copy.scenarios[index] ?? copy.scenarios[0];
    if (!scenario) return;
    setActiveIndex(index);
    trackMarketingEvent(MarketingAnalyticsEvents.LANDING_SCENARIO_SELECTED, {
      scenario: scenario.id,
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const isVertical = window.matchMedia('(min-width: 768px)').matches;
    const previousKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    if (![previousKey, nextKey, 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    const last = copy.scenarios.length - 1;
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? last
          : event.key === previousKey
            ? index === 0
              ? last
              : index - 1
            : index === last
              ? 0
              : index + 1;

    selectScenario(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  }

  if (!active) return null;

  return (
    <div className="mt-12 overflow-hidden rounded-3xl border border-studio-ink/10 bg-white shadow-studio-lg">
      <div className="grid md:grid-cols-[15rem_1fr] lg:grid-cols-[18rem_1fr]">
        <div
          role="tablist"
          aria-label={copy.scenarioAriaLabel}
          aria-orientation="vertical"
          className="scrollbar-none flex gap-2 overflow-x-auto border-b border-studio-ink/10 bg-studio-paper p-3 md:flex-col md:border-b-0 md:border-r md:p-4"
        >
          {copy.scenarios.map((scenario, index) => (
            <button
              key={scenario.id}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={`scenario-tab-${scenario.id}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-controls={`scenario-panel-${scenario.id}`}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => selectScenario(index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={classNames(
                'min-h-12 shrink-0 rounded-xl px-4 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay',
                index === activeIndex
                  ? 'bg-studio-ink text-white shadow-studio-sm'
                  : 'text-studio-muted hover:bg-white hover:text-studio-ink'
              )}
            >
              <span className="md:hidden">{`0${index + 1} · `}</span>
              {scenario.shortLabel}
            </button>
          ))}
        </div>

        <article
          id={`scenario-panel-${active.id}`}
          role="tabpanel"
          aria-labelledby={`scenario-tab-${active.id}`}
          tabIndex={0}
          className="grid min-h-[31rem] outline-none lg:grid-cols-[1.05fr_0.95fr]"
        >
          <section className="flex flex-col justify-between border-b border-studio-ink/10 p-5 sm:p-8 lg:border-b-0 lg:border-r">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-studio-muted">
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                {copy.requestLabel}
              </p>
              <blockquote className="mt-8 font-editorial text-3xl leading-tight text-studio-ink sm:text-4xl">
                “{active.request}”
              </blockquote>
            </div>
            <div className="mt-10 flex items-center gap-3 rounded-2xl border border-studio-ink/10 bg-studio-paper p-4">
              <ShieldCheck className="h-5 w-5 text-studio-forest" aria-hidden="true" />
              <div>
                <p className="text-xs text-studio-muted">
                  {copy.executionRouteLabel}
                </p>
                <p className="text-sm font-semibold text-studio-ink">
                  {active.route} <span className="text-studio-muted">· {active.routeDetail}</span>
                </p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-studio-muted" aria-hidden="true" />
            </div>
          </section>

          <section className="flex flex-col justify-between bg-studio-canvas p-5 sm:p-8">
            <div>
              <span
                className={classNames(
                  'inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold',
                  toneClasses[active.tone]
                )}
              >
                {copy.proposedNextStep}
              </span>
              <p className="mt-6 text-base leading-7 text-studio-muted">{active.result}</p>
              <ul className="mt-7 space-y-3">
                {active.checklist.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-studio-ink">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-studio-sage/35 text-studio-forest">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-10 flex items-center gap-2 border-t border-studio-ink/10 pt-5 text-xs leading-5 text-studio-muted">
              <GitBranch className="h-4 w-4 shrink-0" aria-hidden="true" />
              {copy.sameProject}
            </p>
          </section>
        </article>
      </div>
      <p className="border-t border-studio-ink/10 bg-studio-paper px-5 py-3 text-center text-xs text-studio-muted">
        {copy.disclaimer}
      </p>
    </div>
  );
}
