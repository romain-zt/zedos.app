/**
 * Persisted credit_balance may be negative due to legacy bugs or races.
 * CreditBalance rejects amount < 0 — coerce at the persistence boundary.
 */
export function clampPersistedCreditBalanceNonNegative(raw: number): number {
  return raw < 0 ? 0 : raw;
}
