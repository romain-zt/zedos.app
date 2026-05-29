import { describe, expect, it } from 'vitest';
import { redactLogData, redactOpaqueId } from './log-safe';

describe('redactOpaqueId', () => {
  it('masks short values entirely', () => {
    expect(redactOpaqueId('abc')).toBe('[redacted]');
  });

  it('keeps a short prefix for longer ids', () => {
    expect(redactOpaqueId('cs_test_abcdefghij')).toBe('cs_t…[redacted]');
  });
});

describe('redactLogData', () => {
  it('redacts sensitive keys recursively', () => {
    const redacted = redactLogData({
      userId: 'user-1',
      sessionId: 'cs_live_secret_session',
      nested: { client_secret: 'sk_test_xxx' },
    });

    expect(redacted).toEqual({
      userId: 'user-1',
      sessionId: 'cs_l…[redacted]',
      nested: { client_secret: 'sk_t…[redacted]' },
    });
  });
});
