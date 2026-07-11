'use client';

import { useState, type FormEvent } from 'react';
import type {
  WaitlistContactRequest,
  WaitlistContactResponse,
  WaitlistQualificationRequest,
} from '@repo/contracts/marketing/waitlist';
import {
  MarketingAnalyticsEvents,
  trackMarketingEvent,
} from './marketing-analytics';
import type { LandingCopy } from './landing-copy';

export type WaitlistFormStage = 'contact' | 'qualification' | 'complete';

async function postWaitlist(
  body: WaitlistContactRequest | WaitlistQualificationRequest,
  fallbackError: string
) {
  const response = await fetch('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(fallbackError);
  }
  return result;
}

function optionalValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function useWaitlistForm(
  errors: LandingCopy['waitlist']['errors']
) {
  const [stage, setStage] = useState<WaitlistFormStage>('contact');
  const [leadId, setLeadId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const hasConsent = formData.get('consentToContact') === 'on';
    if (!hasConsent) {
      setError(errors.consent);
      setIsSubmitting(false);
      return;
    }
    const body: WaitlistContactRequest = {
      stage: 'contact',
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      businessName: String(formData.get('businessName') ?? ''),
      businessType: String(formData.get('businessType') ?? '') as WaitlistContactRequest['businessType'],
      website: optionalValue(formData, 'website'),
      consentToContact: true,
      websiteTrap: String(formData.get('websiteTrap') ?? ''),
    };

    try {
      const result = (await postWaitlist(
        body,
        errors.saveApplication
      )) as WaitlistContactResponse;
      setLeadId(result.leadId);
      setStage('qualification');
      trackMarketingEvent(MarketingAnalyticsEvents.WAITLIST_QUALIFICATION_VIEWED, {
        source: 'contact_complete',
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : errors.saveApplication
      );
      trackMarketingEvent(MarketingAnalyticsEvents.WAITLIST_CONTACT_FAILED, {
        error_code: 'request_failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitQualification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!leadId) {
      setError(errors.missingReference);
      setStage('contact');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const body: WaitlistQualificationRequest = {
      stage: 'qualification',
      leadId,
      practitionerRange: optionalValue(
        formData,
        'practitionerRange'
      ) as WaitlistQualificationRequest['practitionerRange'],
      locationRange: optionalValue(
        formData,
        'locationRange'
      ) as WaitlistQualificationRequest['locationRange'],
      bookingPlatform: optionalValue(
        formData,
        'bookingPlatform'
      ) as WaitlistQualificationRequest['bookingPlatform'],
      mainChallenge: optionalValue(
        formData,
        'mainChallenge'
      ) as WaitlistQualificationRequest['mainChallenge'],
      launchTimeframe: optionalValue(
        formData,
        'launchTimeframe'
      ) as WaitlistQualificationRequest['launchTimeframe'],
      desiredChange: optionalValue(formData, 'desiredChange'),
    };

    try {
      await postWaitlist(body, errors.saveDetails);
      setStage('complete');
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : errors.saveDetails
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function skipQualification() {
    setStage('complete');
    trackMarketingEvent(MarketingAnalyticsEvents.WAITLIST_QUALIFICATION_SKIPPED, {
      source: 'qualification_step',
    });
  }

  return {
    stage,
    isSubmitting,
    error,
    submitContact,
    submitQualification,
    skipQualification,
  };
}
