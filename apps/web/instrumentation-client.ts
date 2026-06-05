import posthog from 'posthog-js';
import { readSessionReplayEnabledFromEnv } from '@infrastructure/analytics/posthog-client';

function shouldInitPostHogClient(): boolean {
  if (process.env.NEXT_PUBLIC_POSTHOG_DISABLED === 'true') return false;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return Boolean(key);
}

/**
 * Session replay & error tracking instrumentation.
 *
 * - Session replay is **disabled by default** in every environment.
 *   Operators must explicitly set NEXT_PUBLIC_POSTHOG_SESSION_REPLAY_ENABLED=true
 *   AFTER B-ANALYTICS-001 (legal sign-off) and B-ANALYTICS-002 (masking review)
 *   are cleared. See docs/observability/posthog.md §6.
 * - When replay is enabled, sensitive surfaces are masked via:
 *     - `data-ph-mask` / `.ph-no-capture` → text content masked
 *     - `data-ph-block`                    → element fully blocked
 *     - `maskAllInputs: true`              → every form input value masked
 * - PostHog auto-captures `$exception` from unhandled errors and rejections,
 *   plus explicit `posthog.captureException(...)` calls in the app code.
 */
if (shouldInitPostHogClient()) {
  const replayEnabled = readSessionReplayEnabledFromEnv();
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    disable_session_recording: !replayEnabled,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-ph-mask], .ph-no-capture',
      blockSelector: '[data-ph-block]',
    },
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  });
}
