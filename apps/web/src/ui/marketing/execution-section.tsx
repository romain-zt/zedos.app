import { AlertCircle } from 'lucide-react';
import { executionPaths } from './landing-content';
import { MarketingContainer, SectionIntro } from './landing-primitives';
import { ScenarioExplorer } from './scenario-explorer';

export function ExecutionSection() {
  return (
    <section
      className="bg-studio-canvas py-20 sm:py-28 lg:py-32"
      aria-labelledby="execution-title"
    >
      <MarketingContainer>
        <SectionIntro
          eyebrow="Change without the queue"
          title="Run the everyday. Get the right help for the rest."
          titleId="execution-title"
          body="Zedos does not pretend every request should be handled by AI. It chooses a safer path based on the work, then keeps you in control before anything important changes."
        />
        <ScenarioExplorer />

        <div className="mt-20 grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-forest">
              One platform, three paths
            </p>
            <h3 className="mt-4 font-editorial text-4xl font-medium leading-none text-studio-ink sm:text-5xl">
              Move the business forward your way.
            </h3>
            <p className="mt-5 text-base leading-7 text-studio-muted">
              Everyday use stays simple. Technical freedom remains available when you
              need it.
            </p>
          </header>
          <ol className="divide-y divide-studio-ink/10 border-y border-studio-ink/10">
            {executionPaths.map((path) => (
              <li key={path.number} className="grid gap-3 py-6 sm:grid-cols-[3rem_12rem_1fr] sm:gap-5">
                <span className="font-mono text-xs font-semibold text-studio-clay">
                  {path.number}
                </span>
                <h4 className="font-display text-base font-semibold text-studio-ink">
                  {path.title}
                </h4>
                <p className="text-sm leading-6 text-studio-muted">{path.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <aside className="mt-10 flex items-start gap-3 rounded-2xl border border-studio-clay/20 bg-studio-clay/10 p-5 text-sm leading-6 text-studio-ink">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-studio-clay-dark" aria-hidden="true" />
          <p>
            <strong>AI is one execution path</strong>—not a blank cheque to change
            production. Complex work is scoped separately and only starts after you
            approve it.
          </p>
        </aside>
      </MarketingContainer>
    </section>
  );
}
