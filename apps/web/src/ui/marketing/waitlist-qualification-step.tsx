'use client';

import {
  WaitlistFormError,
  WaitlistFormField,
  WaitlistFormHeader,
  WaitlistSelectField,
  WaitlistSubmitButton,
  waitlistInputClassName,
} from './waitlist-form-controls';

export function WaitlistQualificationStep({
  headingRef,
  isSubmitting,
  error,
  onSubmit,
  onSkip,
}: {
  headingRef: React.RefObject<HTMLHeadingElement>;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onSkip: () => void;
}) {
  return (
    <>
      <WaitlistFormHeader
        headingRef={headingRef}
        step="Application saved"
        title="Help us review the fit."
        body="A little context helps us understand your setup. Every field below is optional."
        saved
      />
      <form className="mt-7 space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <WaitlistSelectField
            id="practitionerRange"
            label="Practitioners"
            options={[
              ['solo', 'Just me'],
              ['2-5', '2–5'],
              ['6-15', '6–15'],
              ['16-plus', '16+'],
            ]}
          />
          <WaitlistSelectField
            id="locationRange"
            label="Locations"
            options={[
              ['online', 'Online only'],
              ['1', 'One'],
              ['2-3', '2–3'],
              ['4-plus', '4+'],
            ]}
          />
        </div>
        <WaitlistSelectField
          id="bookingPlatform"
          label="Current booking platform"
          options={[
            ['none', 'None'],
            ['calendly', 'Calendly'],
            ['planity', 'Planity'],
            ['mindbody', 'Mindbody'],
            ['fresha', 'Fresha'],
            ['booksy', 'Booksy'],
            ['momence', 'Momence'],
            ['other', 'Other'],
          ]}
        />
        <WaitlistSelectField
          id="mainChallenge"
          label="Main frustration"
          options={[
            ['fragmented-tools', 'Too many disconnected tools'],
            ['booking-experience', 'The booking experience'],
            ['slow-changes', 'Changes take too long'],
            ['brand-limitations', 'Brand or design limitations'],
            ['custom-workflow', 'A custom workflow I cannot build'],
            ['replace-platform', 'Replacing the current platform'],
          ]}
        />
        <WaitlistSelectField
          id="launchTimeframe"
          label="When would you like to make a change?"
          options={[
            ['0-3-months', 'Within 3 months'],
            ['3-6-months', '3–6 months'],
            ['6-12-months', '6–12 months'],
            ['exploring', 'Just exploring'],
          ]}
        />
        <WaitlistFormField
          label="What would you most like to change?"
          htmlFor="desiredChange"
          hint="Optional"
        >
          <textarea
            id="desiredChange"
            name="desiredChange"
            rows={4}
            maxLength={600}
            placeholder="A short description is enough."
            className={`${waitlistInputClassName} resize-y py-3`}
          />
        </WaitlistFormField>
        <WaitlistFormError error={error} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <WaitlistSubmitButton loading={isSubmitting}>
            Share my setup
          </WaitlistSubmitButton>
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="min-h-12 rounded-full px-6 text-sm font-semibold text-studio-muted hover:bg-studio-paper hover:text-studio-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay disabled:opacity-50"
          >
            Skip for now
          </button>
        </div>
      </form>
    </>
  );
}
