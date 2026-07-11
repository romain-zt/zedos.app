import { AlertCircle } from 'lucide-react';
import { MarketingContainer, SectionIntro } from './landing-primitives';
import { ScenarioExplorer } from './scenario-explorer';
import type { LandingCopy } from './landing-copy';

export function ExecutionSection({
  copy,
}: {
  copy: LandingCopy['execution'];
}) {
  return (
    <section
      className="bg-studio-canvas py-20 sm:py-28 lg:py-32"
      aria-labelledby="execution-title"
    >
      <MarketingContainer>
        <SectionIntro
          eyebrow={copy.eyebrow}
          title={copy.title}
          titleId="execution-title"
          body={copy.body}
        />
        <ScenarioExplorer copy={copy} />

        <div className="mt-20 grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <header>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-studio-forest">
              {copy.pathsEyebrow}
            </p>
            <h3 className="mt-4 font-editorial text-4xl font-medium leading-none text-studio-ink sm:text-5xl">
              {copy.pathsTitle}
            </h3>
            <p className="mt-5 text-base leading-7 text-studio-muted">
              {copy.pathsBody}
            </p>
          </header>
          <ol className="divide-y divide-studio-ink/10 border-y border-studio-ink/10">
            {copy.paths.map((path) => (
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
            <strong>{copy.noticeTitle}</strong> — {copy.noticeBody}
          </p>
        </aside>
      </MarketingContainer>
    </section>
  );
}
