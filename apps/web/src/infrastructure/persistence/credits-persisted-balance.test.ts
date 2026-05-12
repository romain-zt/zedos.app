import { describe, it, expect } from 'vitest';
import { clampPersistedCreditBalanceNonNegative } from './credits-persisted-balance';

describe('clampPersistedCreditBalanceNonNegative', () => {
  it('returns non-negative values unchanged', () => {
    expect(clampPersistedCreditBalanceNonNegative(0)).toBe(0);
    expect(clampPersistedCreditBalanceNonNegative(42)).toBe(42);
  });

  it('maps negative persisted balances to 0 so CreditBalance construction cannot throw', () => {
    expect(clampPersistedCreditBalanceNonNegative(-1)).toBe(0);
    expect(clampPersistedCreditBalanceNonNegative(-999)).toBe(0);
  });
});
