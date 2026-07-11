'use client';

import { LockKeyhole } from 'lucide-react';
import {
  WaitlistFormError,
  WaitlistFormField,
  WaitlistFormHeader,
  WaitlistSubmitButton,
  waitlistInputClassName,
} from './waitlist-form-controls';
import type { LandingCopy, MarketingLocale } from './landing-copy';

export function WaitlistContactStep({
  isSubmitting,
  error,
  onSubmit,
  locale,
  copy,
}: {
  isSubmitting: boolean;
  error: string | null;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  locale: MarketingLocale;
  copy: LandingCopy['waitlist'];
}) {
  return (
    <>
      <WaitlistFormHeader
        step={copy.contact.step}
        title={copy.contact.title}
        body={copy.contact.body}
      />
      <form className="mt-7 space-y-5" onSubmit={onSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <WaitlistFormField label={copy.contact.name} htmlFor="waitlist-name">
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
          <WaitlistFormField label={copy.contact.email} htmlFor="waitlist-email">
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
        <WaitlistFormField
          label={copy.contact.businessName}
          htmlFor="waitlist-business"
        >
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
        <WaitlistFormField
          label={copy.contact.businessType}
          htmlFor="waitlist-type"
        >
          <select
            id="waitlist-type"
            name="businessType"
            required
            defaultValue=""
            className={waitlistInputClassName}
          >
            <option value="" disabled>
              {copy.contact.businessTypePlaceholder}
            </option>
            {copy.contact.businessTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </WaitlistFormField>
        <WaitlistFormField
          label={copy.contact.website}
          htmlFor="waitlist-website"
          hint={copy.optional}
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
        <div hidden aria-hidden="true">
          <label htmlFor="waitlist-website-trap">
            {copy.contact.websiteTrap}
          </label>
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
            {copy.contact.consentPrefix}
            <a
              href={`/${locale}/legal/privacy`}
              className="inline-flex min-h-11 items-center font-semibold text-studio-ink underline decoration-studio-ink/30 underline-offset-2 hover:decoration-studio-ink"
            >
              {copy.contact.privacyPolicy}
            </a>
            {copy.contact.consentSuffix}
          </span>
        </label>
        <WaitlistFormError error={error} noErrors={copy.noErrors} />
        <WaitlistSubmitButton
          loading={isSubmitting}
          loadingLabel={copy.saving}
        >
          {copy.contact.submit}
        </WaitlistSubmitButton>
        <p className="flex items-center justify-center gap-2 text-center text-xs text-studio-muted">
          <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
          {copy.contact.reassurance}
        </p>
      </form>
    </>
  );
}
