import posthog from 'posthog-js';
import { sanitizeAnalyticsProperties } from './analytics-sanitize';
import type { AnalyticsProperties } from './analytics-events';

export function isClientAnalyticsConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_POSTHOG_DISABLED === 'true') return false;
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
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
