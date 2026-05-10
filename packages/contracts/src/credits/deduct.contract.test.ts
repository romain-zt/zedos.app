import { describe, it, expect } from 'vitest';
import { DeductCreditsRequestSchema, DeductCreditsResponseSchema } from './deduct';

describe('DeductCreditsRequestSchema (T-22)', () => {
  it('parses a valid deduct request', () => {
    const input = {
      userId: 'user_abc123',
      operationType: 'clarification',
      correlationId: 'proj123--clarification--abc-uuid',
    };
    const result = DeductCreditsRequestSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('rejects request missing userId', () => {
    const result = DeductCreditsRequestSchema.safeParse({
      operationType: 'clarification',
      correlationId: 'proj123--clarification--abc',
    });
    expect(result.success).toBe(false);
  });

  it('rejects request with invalid operationType', () => {
    const result = DeductCreditsRequestSchema.safeParse({
      userId: 'user_abc123',
      operationType: 'unknown_operation',
      correlationId: 'proj123--clarification--abc',
    });
    expect(result.success).toBe(false);
  });

  it('rejects request missing correlationId', () => {
    const result = DeductCreditsRequestSchema.safeParse({
      userId: 'user_abc123',
      operationType: 'prd_generation',
    });
    expect(result.success).toBe(false);
  });
});

describe('DeductCreditsResponseSchema (T-22 response)', () => {
  it('parses a valid deduct response', () => {
    const output = {
      userId: 'user_abc123',
      newBalance: 85,
      graceActivated: false,
      correlationId: 'proj123--clarification--abc-uuid',
    };
    const result = DeductCreditsResponseSchema.safeParse(output);
    expect(result.success).toBe(true);
  });

  it('parses a deduct response with graceActivated true', () => {
    const output = {
      userId: 'user_abc123',
      newBalance: -5,
      graceActivated: true,
      correlationId: 'proj123--clarification--abc-uuid',
    };
    const result = DeductCreditsResponseSchema.safeParse(output);
    expect(result.success).toBe(true);
  });

  it('parses an idempotent response', () => {
    const output = {
      userId: 'user_abc123',
      newBalance: 85,
      graceActivated: false,
      correlationId: 'proj123--clarification--abc-uuid',
      idempotent: true,
    };
    const result = DeductCreditsResponseSchema.safeParse(output);
    expect(result.success).toBe(true);
  });

  it('rejects response missing required fields', () => {
    const result = DeductCreditsResponseSchema.safeParse({ userId: 'user_abc123' });
    expect(result.success).toBe(false);
  });
});
