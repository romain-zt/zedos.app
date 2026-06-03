import { PostHog } from 'posthog-node';
import { isE2eMode } from '@shared/testing/e2e-mode';
import { sanitizeAnalyticsProperties } from './analytics-sanitize';
import type { AnalyticsProperties } from './analytics-events';

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

/** Test-only reset for server singleton. */
export function resetServerPostHogForTests(): void {
  serverPostHog = null;
}
