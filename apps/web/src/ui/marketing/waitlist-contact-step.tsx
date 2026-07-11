'use client';

import { LockKeyhole } from 'lucide-react';
import { businessTypeOptions } from './landing-content';
import {
  WaitlistFormError,
  WaitlistFormField,
  WaitlistFormHeader,
  WaitlistSubmitButton,
  waitlistInputClassName,
} from './waitlist-form-controls';

export function WaitlistContactStep({
  isSubmitting,
  error,
  onSubmit,
}: {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
}) {
  return (
    <>
      <WaitlistFormHeader
        step="Step 1 of 2"
        title="Start with the basics."
        body="We save your application here. The next step is optional."
      />
      <form className="mt-7 space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <WaitlistFormField label="Your name" htmlFor="waitlist-name">
            <input
              id="waitlist-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              className={waitlistInputClassName}
            />
          </WaitlistFormField>
          <WaitlistFormField label="Work email" htmlFor="waitlist-email">
            <input
              id="waitlist-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={254}
              className={waitlistInputClassName}
            />
          </WaitlistFormField>
        </div>
        <WaitlistFormField label="Business name" htmlFor="waitlist-business">
          <input
            id="waitlist-business"
            name="businessName"
            type="text"
            autoComplete="organization"
            required
            minLength={2}
            maxLength={120}
            className={waitlistInputClassName}
          />
        </WaitlistFormField>
        <WaitlistFormField label="Business type" htmlFor="waitlist-type">
          <select
            id="waitlist-type"
            name="businessType"
            required
            defaultValue=""
            className={waitlistInputClassName}
          >
            <option value="" disabled>
              Select your business
            </option>
            {businessTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </WaitlistFormField>
        <WaitlistFormField
          label="Website or social profile"
          htmlFor="waitlist-website"
          hint="Optional"
        >
          <input
            id="waitlist-website"
            name="website"
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://"
            maxLength={2048}
            className={waitlistInputClassName}
          />
        </WaitlistFormField>
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="waitlist-website-trap">Company website</label>
          <input
            id="waitlist-website-trap"
            name="websiteTrap"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl bg-studio-paper p-3 text-sm leading-5 text-studio-muted">
          <input
            name="consentToContact"
            type="checkbox"
            required
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-studio-ink/25 accent-studio-forest"
          />
          <span>
            I agree to be contacted about Zedos early access. Read the{' '}
            <a
              href="/legal/privacy"
              className="font-semibold text-studio-ink underline decoration-studio-ink/30 underline-offset-2 hover:decoration-studio-ink"
            >
              privacy policy
            </a>
            .
          </span>
        </label>
        <WaitlistFormError error={error} />
        <WaitlistSubmitButton loading={isSubmitting}>
          Apply for early access
        </WaitlistSubmitButton>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-studio-muted">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
          No generic sales sequence. We review every application ourselves.
        </p>
      </form>
    </>
  );
}
