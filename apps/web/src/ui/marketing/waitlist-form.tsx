'use client';

import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { useWaitlistForm } from './use-waitlist-form';
import { WaitlistContactStep } from './waitlist-contact-step';
import { WaitlistQualificationStep } from './waitlist-qualification-step';
import type { LandingCopy, MarketingLocale } from './landing-copy';

export function WaitlistForm({
  locale,
  copy,
}: {
  locale: MarketingLocale;
  copy: LandingCopy['waitlist'];
}) {
  const {
    stage,
    isSubmitting,
    error,
    submitContact,
    submitQualification,
    skipQualification,
  } = useWaitlistForm(copy.errors);
  const stageHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (stage !== 'contact') stageHeadingRef.current?.focus();
  }, [stage]);

  return (
    <div
      className="rounded-3xl border border-studio-ink/10 bg-studio-canvas p-5 shadow-studio-xl sm:p-8"
      data-ph-block
    >
      {stage === 'contact' ? (
        <WaitlistContactStep
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={submitContact}
          locale={locale}
          copy={copy}
        />
      ) : null}
      {stage === 'qualification' ? (
        <WaitlistQualificationStep
          headingRef={stageHeadingRef}
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={submitQualification}
          onSkip={skipQualification}
          copy={copy}
        />
      ) : null}
      {stage === 'complete' ? (
        <CompleteStep headingRef={stageHeadingRef} copy={copy.complete} />
      ) : null}
    </div>
  );
}

function CompleteStep({
  headingRef,
  copy,
}: {
  headingRef: React.RefObject<HTMLHeadingElement>;
  copy: LandingCopy['waitlist']['complete'];
}) {
  return (
    <section className="flex min-h-[30rem] flex-col items-center justify-center text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-studio-sage/35 text-studio-forest">
        <Check className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-7 text-xs font-semibold uppercase tracking-widest text-studio-forest">
        {copy.eyebrow}
      </p>
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 font-editorial text-4xl font-medium text-studio-ink outline-none"
      >
        {copy.title}
      </h3>
      <p className="mt-5 max-w-md text-base leading-7 text-studio-muted">
        {copy.body}
      </p>
    </section>
  );
}
