import { PostHog } from 'posthog-node';
import { isE2eMode } from '@shared/testing/e2e-mode';
import { sanitizeAnalyticsProperties } from './analytics-sanitize';
import {
  AnalyticsEvents,
  type AnalyticsProperties,
} from './analytics-events';

export function isServerAnalyticsConfigured(): boolean {
  if (isE2eMode()) return false;
  if (process.env.NEXT_PUBLIC_POSTHOG_DISABLED === 'true') return false;
  const key = process.env.POSTHOG_API_KEY?.trim() ?? process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return Boolean(key);
}

let serverPostHog: PostHog | null = null;

function getServerPostHog(): PostHog | null {
  if (!isServerAnalyticsConfigured()) return null;
  if (serverPostHog) return serverPostHog;
  const apiKey = process.env.POSTHOG_API_KEY?.trim() ?? process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!apiKey) return null;
  const host =
    process.env.POSTHOG_HOST?.trim() ??
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() ??
    'https://eu.i.posthog.com';
  serverPostHog = new PostHog(apiKey, { host, flushAt: 1, flushInterval: 0 });
  return serverPostHog;
}

export function captureServer(
  event: string,
  distinctId: string,
  properties: AnalyticsProperties = {}
): void {
  if (!distinctId.trim()) return;
  const client = getServerPostHog();
  if (!client) return;
  try {
    client.capture({
      distinctId,
      event,
      properties: sanitizeAnalyticsProperties(properties),
    });
  } catch {
    // Fire-and-forget
  }
}

/** Metadata accepted on a captured server exception. PII keys are stripped. */
export type ServerExceptionMetadata = AnalyticsProperties;

/**
 * Capture a server-side exception (no PRD/clarification text in properties).
 *
 * Uses a `server_exception` analytics event because `posthog-node` does not
 * expose `captureException`; the typed properties bag carries `error_code`,
 * `route`, `project_id`, etc. for grouping in PostHog Error Tracking.
 */
export function captureServerException(
  error: Error,
  distinctId: string,
  metadata: ServerExceptionMetadata = {}
): void {
  if (!distinctId.trim()) return;
  const client = getServerPostHog();
  if (!client) return;
  const sanitized = sanitizeAnalyticsProperties(metadata);
  try {
    client.capture({
      distinctId,
      event: AnalyticsEvents.SERVER_EXCEPTION,
      properties: {
        ...sanitized,
        exception_name: error.name,
      },
    });
  } catch {
    // Fire-and-forget
  }
}

/** Test-only reset for server singleton. */
export function resetServerPostHogForTests(): void {
  serverPostHog = null;
}
