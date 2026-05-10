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

  describe('computeDeductionDecision (T-1, T-2)', () => {
    it('returns proceed when balance >= cost', () => {
      const d = CreditsDomainService.computeDeductionDecision(100, false, 10);
      expect(d.kind).toBe('proceed');
      expect(d.newBalance).toBe(90);
      expect(d.willActivateGrace).toBe(false);
    });

    it('returns proceed when balance equals cost exactly', () => {
      const d = CreditsDomainService.computeDeductionDecision(10, false, 10);
      expect(d.kind).toBe('proceed');
      expect(d.newBalance).toBe(0);
    });

    it('returns proceed-with-grace when balance < cost and grace not used and overage <= ceiling', () => {
      const d = CreditsDomainService.computeDeductionDecision(5, false, 15, 20);
      expect(d.kind).toBe('proceed-with-grace');
      expect(d.newBalance).toBe(-10);
      expect(d.willActivateGrace).toBe(true);
    });

    it('returns proceed-with-grace at ceiling boundary (overage === ceiling)', () => {
      const d = CreditsDomainService.computeDeductionDecision(0, false, 20, 20);
      expect(d.kind).toBe('proceed-with-grace');
      expect(d.newBalance).toBe(-20);
    });

    it('returns reject(overage-exceeds-ceiling) when overage > ceiling and grace not used', () => {
      const d = CreditsDomainService.computeDeductionDecision(5, false, 30, 20);
      expect(d.kind).toBe('reject');
      if (d.kind === 'reject') {
        expect(d.reason).toBe('overage-exceeds-ceiling');
      }
    });

    it('returns reject(grace-exhausted) when balance < cost and grace already used', () => {
      const d = CreditsDomainService.computeDeductionDecision(5, true, 15, 20);
      expect(d.kind).toBe('reject');
      if (d.kind === 'reject') {
        expect(d.reason).toBe('grace-exhausted');
      }
    });

    it('returns reject(grace-exhausted) when balance is 0 and grace already used', () => {
      const d = CreditsDomainService.computeDeductionDecision(0, true, 1, 20);
      expect(d.kind).toBe('reject');
      if (d.kind === 'reject') {
        expect(d.reason).toBe('grace-exhausted');
      }
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
