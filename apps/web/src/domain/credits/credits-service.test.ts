import { describe, it, expect } from 'vitest';
import { CreditsDomainService } from './credits-service';

describe('CreditsDomainService', () => {
  describe('computeDeductionDecision', () => {
    it('proceeds without grace when balance covers cost', () => {
      const d = CreditsDomainService.computeDeductionDecision(50, false, 10, 20);
      expect(d).toEqual({ kind: 'proceed', newBalance: 40, willActivateGrace: false });
    });

    it('returns proceed-with-grace when balance insufficient and within ceiling', () => {
      const d = CreditsDomainService.computeDeductionDecision(5, false, 15, 20);
      expect(d).toEqual({ kind: 'proceed-with-grace', newBalance: -10, willActivateGrace: true });
    });

    it('allows grace exactly at ceiling boundary', () => {
      const d = CreditsDomainService.computeDeductionDecision(10, false, 30, 20);
      expect(d).toEqual({ kind: 'proceed-with-grace', newBalance: -20, willActivateGrace: true });
    });

    it('rejects when overage exceeds configured ceiling', () => {
      expect(CreditsDomainService.computeDeductionDecision(5, false, 30, 20).kind).toBe('reject');
    });

    it('allows wider overage only when grace ceiling is sufficiently high', () => {
      expect(CreditsDomainService.computeDeductionDecision(5, false, 30, 24).kind).toBe('reject');
      expect(CreditsDomainService.computeDeductionDecision(5, false, 30, 25).kind).toBe(
        'proceed-with-grace'
      );
    });

    it('rejects when lockedGraceUsed is already true even if ceiling would permit', () => {
      expect(CreditsDomainService.computeDeductionDecision(5, true, 15, 20).kind).toBe('reject');
    });
  });

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

    it('respects configurable graceCreditCeiling (not hardcoded)', () => {
      expect(CreditsDomainService.canOperationProceed(30, 5, true, false, 20).canProceed).toBe(false);
      expect(CreditsDomainService.canOperationProceed(30, 5, true, false, 25).canProceed).toBe(true);
    });

    it('blocks grace when gracePeriodAvailable is false', () => {
      const borderline = CreditsDomainService.computeDeductionDecision(5, false, 10, 20);
      expect(borderline.kind).toBe('proceed-with-grace');

      const r = CreditsDomainService.canOperationProceed(10, 5, false, false, 20);
      expect(r).toEqual({ canProceed: false, useGrace: false });
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
