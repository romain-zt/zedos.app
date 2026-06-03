import {
  FORBIDDEN_ANALYTICS_PROPERTY_KEYS,
  type AnalyticsProperties,
  type ForbiddenAnalyticsPropertyKey,
} from './analytics-events';

const forbiddenKeySet = new Set<string>(FORBIDDEN_ANALYTICS_PROPERTY_KEYS);

export function isForbiddenAnalyticsKey(key: string): key is ForbiddenAnalyticsPropertyKey {
  return forbiddenKeySet.has(key.toLowerCase());
}

export function sanitizeAnalyticsProperties(
  properties: AnalyticsProperties
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (isForbiddenAnalyticsKey(key)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    }
  }
  return out;
}
