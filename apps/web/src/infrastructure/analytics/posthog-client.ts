import posthog from 'posthog-js';
import { sanitizeAnalyticsProperties } from './analytics-sanitize';
import {
  AnalyticsEvents,
  type AnalyticsProperties,
} from './analytics-events';

export function isClientAnalyticsConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_POSTHOG_DISABLED === 'true') return false;
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}

/**
 * Read-only env gate for session replay.
 * B-ANALYTICS-001 (legal) + B-ANALYTICS-002 (masking sign-off) before flipping in prod.
 * Default: false. Module-load instrumentation reads via `isSessionReplayEnabled`.
 */
export function readSessionReplayEnabledFromEnv(): boolean {
  if (process.env.NEXT_PUBLIC_POSTHOG_DISABLED === 'true') return false;
  return process.env.NEXT_PUBLIC_POSTHOG_SESSION_REPLAY_ENABLED === 'true';
}

export function isSessionReplayEnabled(): boolean {
  if (!isClientAnalyticsConfigured()) return false;
  return readSessionReplayEnabledFromEnv();
}

export function captureClient(event: string, properties: AnalyticsProperties = {}): void {
  if (!isClientAnalyticsConfigured()) return;
  try {
    posthog.capture(event, sanitizeAnalyticsProperties(properties));
  } catch {
    // Fire-and-forget — never block UX
  }
}

export function identifyClient(
  distinctId: string,
  properties: AnalyticsProperties = {}
): void {
  if (!isClientAnalyticsConfigured()) return;
  if (!distinctId.trim()) return;
  try {
    posthog.identify(distinctId, sanitizeAnalyticsProperties(properties));
  } catch {
    // Fire-and-forget
  }
}

/** Metadata accepted on a captured client exception. PII keys are stripped. */
export type ClientExceptionMetadata = AnalyticsProperties;

/**
 * Capture a client-side exception via PostHog Error Tracking.
 *
 * - Properties are sanitized through `sanitizeAnalyticsProperties` so
 *   PRD/clarification text (and other forbidden keys) cannot leak.
 * - Caller passes a real `Error` — non-Error throw values must be normalized
 *   before invocation (`error instanceof Error ? error : new Error(String(error))`).
 * - A companion `client_exception` analytics event is captured with the same
 *   metadata so funnels/cohorts can filter by exception even if Error
 *   Tracking ingestion is degraded.
 */
export function captureClientException(
  error: Error,
  metadata: ClientExceptionMetadata = {}
): void {
  if (!isClientAnalyticsConfigured()) return;
  const sanitized = sanitizeAnalyticsProperties(metadata);
  try {
    posthog.captureException(error, sanitized);
  } catch {
    // Fire-and-forget
  }
  try {
    posthog.capture(AnalyticsEvents.CLIENT_EXCEPTION, {
      ...sanitized,
      exception_name: error.name,
    });
  } catch {
    // Fire-and-forget
  }
}
