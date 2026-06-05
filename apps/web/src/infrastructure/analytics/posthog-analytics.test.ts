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
import { readSessionReplayEnabledFromEnv } from './posthog-client';

describe('posthog-analytics', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    resetServerPostHogForTests();
    process.env = { ...envBackup };
    delete process.env.E2E_MODE;
    delete process.env.NEXT_PUBLIC_POSTHOG_DISABLED;
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.POSTHOG_API_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_SESSION_REPLAY_ENABLED;
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

  it('exposes friction-replay error events for filtering', () => {
    expect(AnalyticsEvents.CLARIFY_FAILED).toBe('clarify_failed');
    expect(AnalyticsEvents.PRD_GENERATION_FAILED).toBe('prd_generation_failed');
    expect(AnalyticsEvents.CLIENT_EXCEPTION).toBe('client_exception');
    expect(AnalyticsEvents.SERVER_EXCEPTION).toBe('server_exception');
    expect(AnalyticsEvents.CHUNK_LOAD_ERROR).toBe('chunk_load_error');
  });

  it('readSessionReplayEnabledFromEnv defaults to false', () => {
    expect(readSessionReplayEnabledFromEnv()).toBe(false);
  });

  it('readSessionReplayEnabledFromEnv stays false when flag is unset', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    expect(readSessionReplayEnabledFromEnv()).toBe(false);
  });

  it('readSessionReplayEnabledFromEnv is true only on explicit "true" opt-in', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    process.env.NEXT_PUBLIC_POSTHOG_SESSION_REPLAY_ENABLED = 'true';
    expect(readSessionReplayEnabledFromEnv()).toBe(true);
  });

  it('readSessionReplayEnabledFromEnv is false when PostHog disabled even with replay opt-in', () => {
    process.env.NEXT_PUBLIC_POSTHOG_DISABLED = 'true';
    process.env.NEXT_PUBLIC_POSTHOG_SESSION_REPLAY_ENABLED = 'true';
    expect(readSessionReplayEnabledFromEnv()).toBe(false);
  });

  it('readSessionReplayEnabledFromEnv ignores ambiguous truthy values like "1" or "yes"', () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = 'phc_test';
    process.env.NEXT_PUBLIC_POSTHOG_SESSION_REPLAY_ENABLED = '1';
    expect(readSessionReplayEnabledFromEnv()).toBe(false);
    process.env.NEXT_PUBLIC_POSTHOG_SESSION_REPLAY_ENABLED = 'yes';
    expect(readSessionReplayEnabledFromEnv()).toBe(false);
  });

  it('sanitizeAnalyticsProperties strips PRD/clarification text from exception metadata', () => {
    const sanitized = sanitizeAnalyticsProperties({
      project_id: 'proj-1',
      route: 'api/projects/[id]/clarify',
      error_code: 'clarify_request_failed',
      http_status: 500,
      message: 'sensitive AI prompt content',
      content: 'PRD body',
      transcript: 'clarification transcript',
      structured_question: 'should not leak',
      founder_answer: 'should not leak',
    });
    expect(sanitized).toEqual({
      project_id: 'proj-1',
      route: 'api/projects/[id]/clarify',
      error_code: 'clarify_request_failed',
      http_status: 500,
    });
  });
});
