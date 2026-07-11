'use client';

import {
  WaitlistFormError,
  WaitlistFormField,
  WaitlistFormHeader,
  WaitlistSelectField,
  WaitlistSubmitButton,
  waitlistInputClassName,
} from './waitlist-form-controls';
import type { LandingCopy } from './landing-copy';

export function WaitlistQualificationStep({
  headingRef,
  isSubmitting,
  error,
  onSubmit,
  onSkip,
  copy,
}: {
  headingRef: React.RefObject<HTMLHeadingElement>;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onSkip: () => void;
  copy: LandingCopy['waitlist'];
}) {
  return (
    <>
      <WaitlistFormHeader
        headingRef={headingRef}
        step={copy.qualification.step}
        title={copy.qualification.title}
        body={copy.qualification.body}
        saved
      />
      <form className="mt-7 space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <WaitlistSelectField
            id="practitionerRange"
            label={copy.qualification.practitioners}
            options={copy.qualification.practitionerOptions}
            optionalLabel={copy.optional}
            placeholder={copy.selectOne}
          />
          <WaitlistSelectField
            id="locationRange"
            label={copy.qualification.locations}
            options={copy.qualification.locationOptions}
            optionalLabel={copy.optional}
            placeholder={copy.selectOne}
          />
        </div>
        <WaitlistSelectField
          id="bookingPlatform"
          label={copy.qualification.bookingPlatform}
          options={copy.qualification.bookingPlatformOptions}
          optionalLabel={copy.optional}
          placeholder={copy.selectOne}
        />
        <WaitlistSelectField
          id="mainChallenge"
          label={copy.qualification.mainChallenge}
          options={copy.qualification.challengeOptions}
          optionalLabel={copy.optional}
          placeholder={copy.selectOne}
        />
        <WaitlistSelectField
          id="launchTimeframe"
          label={copy.qualification.timeframe}
          options={copy.qualification.timeframeOptions}
          optionalLabel={copy.optional}
          placeholder={copy.selectOne}
        />
        <WaitlistFormField
          label={copy.qualification.desiredChange}
          htmlFor="desiredChange"
          hint={copy.optional}
        >
          <textarea
            id="desiredChange"
            name="desiredChange"
            rows={4}
            maxLength={600}
            placeholder={copy.qualification.desiredChangePlaceholder}
            className={`${waitlistInputClassName} resize-y py-3`}
          />
        </WaitlistFormField>
        <WaitlistFormError error={error} noErrors={copy.noErrors} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <WaitlistSubmitButton
            loading={isSubmitting}
            loadingLabel={copy.saving}
          >
            {copy.qualification.submit}
          </WaitlistSubmitButton>
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="min-h-12 rounded-full px-6 text-sm font-semibold text-studio-muted hover:bg-studio-paper hover:text-studio-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay disabled:opacity-50"
          >
            {copy.qualification.skip}
          </button>
        </div>
      </form>
    </>
  );
}
