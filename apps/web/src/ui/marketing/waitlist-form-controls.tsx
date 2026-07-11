'use client';

import { ArrowRight, Check, LoaderCircle } from 'lucide-react';

export const waitlistInputClassName =
  'mt-2 min-h-12 w-full rounded-xl border border-studio-ink/15 bg-white px-4 text-base text-studio-ink outline-none transition placeholder:text-studio-muted/60 focus:border-studio-forest focus:ring-2 focus:ring-studio-sage/40';

export function WaitlistFormHeader({
  step,
  title,
  body,
  saved = false,
  headingRef,
}: {
  step: string;
  title: string;
  body: string;
  saved?: boolean;
  headingRef?: React.RefObject<HTMLHeadingElement>;
}) {
  return (
    <header>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-studio-forest">
        {saved ? (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-studio-sage/40">
            <Check className="h-3 w-3" aria-hidden="true" />
          </span>
        ) : null}
        {step}
      </p>
      <h3
        ref={headingRef}
        tabIndex={headingRef ? -1 : undefined}
        className="mt-3 font-editorial text-3xl font-medium text-studio-ink outline-none sm:text-4xl"
      >
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-studio-muted">{body}</p>
    </header>
  );
}

export function WaitlistFormField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-studio-ink">
        {label}
        {hint ? <span className="ml-2 font-normal text-studio-muted">{hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

export function WaitlistSelectField({
  id,
  label,
  options,
}: {
  id: string;
  label: string;
  options: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <WaitlistFormField label={label} htmlFor={id} hint="Optional">
      <select id={id} name={id} defaultValue="" className={waitlistInputClassName}>
        <option value="">Select one</option>
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
    </WaitlistFormField>
  );
}

export function WaitlistFormError({ error }: { error: string | null }) {
  return (
    <p
      role={error ? 'alert' : undefined}
      aria-live="polite"
      className={error ? 'rounded-xl bg-red-50 p-3 text-sm text-red-800' : 'sr-only'}
    >
      {error ?? 'No form errors'}
    </p>
  );
}

export function WaitlistSubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading || undefined}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-studio-ink px-6 text-base font-semibold text-white shadow-studio-md transition hover:bg-studio-forest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-studio-clay focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65 sm:w-auto"
    >
      {loading ? (
        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      )}
      {loading ? 'Saving…' : children}
    </button>
  );
}
