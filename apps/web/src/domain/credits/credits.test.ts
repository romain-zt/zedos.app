import { describe, it, expect } from 'vitest';
import { CreditBalance, CreditOperation } from './credits';
import { UserId } from '../user/user';

const uid = new UserId('user-1');

describe('CreditBalance', () => {
  it('creates with valid args', () => {
    const b = new CreditBalance(uid, 100, false);
    expect(b.amount).toBe(100);
    expect(b.graceUsed).toBe(false);
  });

  it('canDeduct returns true when sufficient', () => {
    expect(new CreditBalance(uid, 10).canDeduct(5)).toBe(true);
    expect(new CreditBalance(uid, 10).canDeduct(10)).toBe(true);
  });

  it('canDeduct returns false when insufficient', () => {
    expect(new CreditBalance(uid, 5).canDeduct(6)).toBe(false);
  });

  it('deduct returns new balance', () => {
    const b = new CreditBalance(uid, 20).deduct(7);
    expect(b.amount).toBe(13);
  });

  it('deduct throws on insufficient', () => {
    expect(() => new CreditBalance(uid, 3).deduct(5)).toThrow('Insufficient credits');
  });

  it('add returns new balance', () => {
    const b = new CreditBalance(uid, 10).add(5);
    expect(b.amount).toBe(15);
  });

  it('add throws on negative', () => {
    expect(() => new CreditBalance(uid, 10).add(-1)).toThrow('Cannot add negative credits');
  });

  it('useGrace sets flag', () => {
    const b = new CreditBalance(uid, 10, false).useGrace();
    expect(b.graceUsed).toBe(true);
  });

  it('useGrace throws if already used', () => {
    expect(() => new CreditBalance(uid, 10, true).useGrace()).toThrow('Grace period already used');
  });
});

describe('CreditOperation', () => {
  it('creates with valid cost', () => {
    const op = new CreditOperation('clarification', 3);
    expect(op.type).toBe('clarification');
    expect(op.cost).toBe(3);
  });

  it('throws on negative cost', () => {
    expect(() => new CreditOperation('decision', -1)).toThrow('Credit cost cannot be negative');
  });
});
