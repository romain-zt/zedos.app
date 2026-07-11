'use client';

import { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { useWaitlistForm } from './use-waitlist-form';
import { WaitlistContactStep } from './waitlist-contact-step';
import { WaitlistQualificationStep } from './waitlist-qualification-step';

export function WaitlistForm() {
  const {
    stage,
    isSubmitting,
    error,
    submitContact,
    submitQualification,
    skipQualification,
  } = useWaitlistForm();
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
        />
      ) : null}
      {stage === 'qualification' ? (
        <WaitlistQualificationStep
          headingRef={stageHeadingRef}
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={submitQualification}
          onSkip={skipQualification}
        />
      ) : null}
      {stage === 'complete' ? (
        <CompleteStep headingRef={stageHeadingRef} />
      ) : null}
    </div>
  );
}

function CompleteStep({
  headingRef,
}: {
  headingRef: React.RefObject<HTMLHeadingElement>;
}) {
  return (
    <section className="flex min-h-[30rem] flex-col items-center justify-center text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-studio-sage/35 text-studio-forest">
        <Check className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="mt-7 text-xs font-semibold uppercase tracking-widest text-studio-forest">
        Application complete
      </p>
      <h3
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 font-editorial text-4xl font-medium text-studio-ink outline-none"
      >
        Thanks. You are on the list.
      </h3>
      <p className="mt-5 max-w-md text-base leading-7 text-studio-muted">
        We review every application ourselves. If your setup fits the current pilot,
        the founder will email you with next steps. We will not add you to a generic
        newsletter.
      </p>
    </section>
  );
}
