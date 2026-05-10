import { describe, it, expect } from 'vitest';
import { UserId, Email } from './user';

describe('UserId', () => {
  it('creates with valid value', () => {
    const id = new UserId('abc-123');
    expect(id.value).toBe('abc-123');
  });

  it('throws on empty string', () => {
    expect(() => new UserId('')).toThrow('UserId cannot be empty');
  });

  it('throws on whitespace-only', () => {
    expect(() => new UserId('   ')).toThrow('UserId cannot be empty');
  });

  it('equals compares values', () => {
    const a = new UserId('x');
    const b = new UserId('x');
    const c = new UserId('y');
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});

describe('Email', () => {
  it('creates with valid email', () => {
    const email = new Email('test@example.com');
    expect(email.value).toBe('test@example.com');
  });

  it('throws on invalid format', () => {
    expect(() => new Email('notanemail')).toThrow('Invalid email format');
    expect(() => new Email('')).toThrow('Invalid email format');
    expect(() => new Email('a@')).toThrow('Invalid email format');
  });

  it('equals is case-insensitive', () => {
    const a = new Email('Test@Example.COM');
    const b = new Email('test@example.com');
    expect(a.equals(b)).toBe(true);
  });

  it('toString returns value', () => {
    expect(new Email('a@b.com').toString()).toBe('a@b.com');
  });
});
