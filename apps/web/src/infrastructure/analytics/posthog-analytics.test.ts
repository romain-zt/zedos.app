import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  FORBIDDEN_ANALYTICS_PROPERTY_KEYS,
  AnalyticsEvents,
  balanceBucketFromCount,
} from './analytics-events';
import {
  isForbiddenAnalyticsKey,
  sanitizeAnalyticsProperties,
} from './analytics-sanitize';
import {
  isServerAnalyticsConfigured,
  resetServerPostHogForTests,
} from './posthog-server';

describe('posthog-analytics', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    resetServerPostHogForTests();
    process.env = { ...envBackup };
    delete process.env.E2E_MODE;
    delete process.env.NEXT_PUBLIC_POSTHOG_DISABLED;
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.POSTHOG_API_KEY;
  });

  afterEach(() => {
    process.env = { ...envBackup };
    resetServerPostHogForTests();
  });

  it('isServerAnalyticsConfigured is false when PostHog disabled flag is set', () => {
    process.env.NEXT_PUBLIC_POSTHOG_DISABLED = 'true';
    process.env.POSTHOG_API_KEY = 'phc_test';
    expect(isServerAnalyticsConfigured()).toBe(false);
  });

  it('isServerAnalyticsConfigured is false in E2E_MODE on server', () => {
    process.env.E2E_MODE = 'true';
    process.env.POSTHOG_API_KEY = 'phc_test';
    expect(isServerAnalyticsConfigured()).toBe(false);
  });

  it('isServerAnalyticsConfigured is false without API keys on server', () => {
    expect(isServerAnalyticsConfigured()).toBe(false);
  });

  it('flags forbidden property keys', () => {
    for (const key of FORBIDDEN_ANALYTICS_PROPERTY_KEYS) {
      expect(isForbiddenAnalyticsKey(key)).toBe(true);
    }
    expect(isForbiddenAnalyticsKey('project_id')).toBe(false);
  });

  it('sanitizeAnalyticsProperties strips forbidden keys and nullish values', () => {
    const sanitized = sanitizeAnalyticsProperties({
      project_id: 'proj-1',
      journey_mode: 'express',
      email: 'secret@example.com',
      message: 'should not appear',
      empty: null,
      version_number: 1,
    });
    expect(sanitized).toEqual({
      project_id: 'proj-1',
      journey_mode: 'express',
      version_number: 1,
    });
  });

  it('balanceBucketFromCount segments balances without exposing exact values', () => {
    expect(balanceBucketFromCount(0)).toBe('zero');
    expect(balanceBucketFromCount(5)).toBe('low');
    expect(balanceBucketFromCount(50)).toBe('ok');
  });

  it('event constants use snake_case names', () => {
    const names = Object.values(AnalyticsEvents);
    for (const name of names) {
      expect(name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});
