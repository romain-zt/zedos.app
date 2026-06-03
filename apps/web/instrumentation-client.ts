import posthog from 'posthog-js';

function shouldInitPostHogClient(): boolean {
  if (process.env.NEXT_PUBLIC_POSTHOG_DISABLED === 'true') return false;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return Boolean(key);
}

if (shouldInitPostHogClient()) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
  });
}
