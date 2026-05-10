import { describe, it, expect } from 'vitest';
import { CreditsDomainService } from './credits-service';

describe('CreditsDomainService', () => {
  describe('canOperationProceed', () => {
    it('approves when balance >= cost', () => {
      const r = CreditsDomainService.canOperationProceed(5, 10, true, false);
      expect(r.canProceed).toBe(true);
      expect(r.useGrace).toBe(false);
    });

    it('approves with grace when balance insufficient but grace available', () => {
      const r = CreditsDomainService.canOperationProceed(15, 5, true, false);
      expect(r.canProceed).toBe(true);
      expect(r.useGrace).toBe(true);
    });

    it('rejects when balance insufficient and grace already used', () => {
      const r = CreditsDomainService.canOperationProceed(15, 5, true, true);
      expect(r.canProceed).toBe(false);
    });

    it('rejects when balance insufficient and grace not available', () => {
      const r = CreditsDomainService.canOperationProceed(15, 5, false, false);
      expect(r.canProceed).toBe(false);
    });

    it('rejects when cost exceeds balance + grace', () => {
      const r = CreditsDomainService.canOperationProceed(30, 5, true, false);
      expect(r.canProceed).toBe(false);
    });
  });

  describe('buildCreditCheckResult', () => {
    it('returns approved message for normal approval', () => {
      const r = CreditsDomainService.buildCreditCheckResult(true, 20, 5, false, false, false);
      expect(r.canProceed).toBe(true);
      expect(r.message).toContain('approved');
    });

    it('returns grace message when using grace', () => {
      const r = CreditsDomainService.buildCreditCheckResult(true, 5, 15, true, false, true);
      expect(r.canProceed).toBe(true);
      expect(r.graceApplicable).toBe(true);
      expect(r.graceWillExpire).toBe(true);
      expect(r.message).toContain('grace period');
    });

    it('returns insufficient message when rejected', () => {
      const r = CreditsDomainService.buildCreditCheckResult(false, 2, 10, false, false, false);
      expect(r.canProceed).toBe(false);
      expect(r.message).toContain('Insufficient');
    });
  });
});
