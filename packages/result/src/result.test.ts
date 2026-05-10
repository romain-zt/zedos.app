import { describe, it, expect } from 'vitest';
import { ok, err, Ok, Err, collect, Result } from './index';

describe('Result<T,E>', () => {
  describe('Ok', () => {
    it('isOk returns true', () => {
      const r = ok(42);
      expect(r.isOk()).toBe(true);
      expect(r.isErr()).toBe(false);
    });

    it('unwrap returns value', () => {
      expect(ok('hello').unwrap()).toBe('hello');
    });

    it('map transforms value', () => {
      const r = ok(5).map((x) => x * 2);
      expect(r._unsafeUnwrap()).toBe(10);
    });

    it('flatMap chains results (andThen in neverthrow)', () => {
      const r = ok(5).andThen((x) => ok(x + 1));
      expect(r._unsafeUnwrap()).toBe(6);
    });

    it('andThen propagates error', () => {
      const r = ok(5).andThen(() => err(new Error('fail')));
      expect(r.isErr()).toBe(true);
    });

    it('unwrapOr returns value', () => {
      expect(ok(10).unwrapOr(0)).toBe(10);
    });

    it('mapErr is no-op for Ok', () => {
      const r = ok(1).mapErr(() => new Error('mapped'));
      expect(r.isOk()).toBe(true);
      expect(r._unsafeUnwrap()).toBe(1);
    });
  });

  describe('Err', () => {
    it('isErr returns true', () => {
      const r = err(new Error('bad'));
      expect(r.isErr()).toBe(true);
      expect(r.isOk()).toBe(false);
    });

    it('unwrap throws', () => {
      expect(() => err(new Error('bad')).unwrap()).toThrow('bad');
    });

    it('unwrapOr returns fallback', () => {
      const r: Result<number> = err(new Error('bad'));
      expect(r.unwrapOr(99)).toBe(99);
    });

    it('map is no-op for Err', () => {
      const r = err<number>(new Error('x')).map(() => 42);
      expect(r.isErr()).toBe(true);
    });

    it('mapErr transforms error', () => {
      const r = err(new Error('a')).mapErr(() => new Error('b'));
      expect(r.isErr()).toBe(true);
      if (r.isErr()) {
        expect(r.error.message).toBe('b');
      }
    });

    it('andThen propagates error', () => {
      const r = err<number>(new Error('nope')).andThen(() => ok(1));
      expect(r.isErr()).toBe(true);
    });
  });

  describe('collect', () => {
    it('returns Ok array when all Ok', () => {
      const r = collect([ok(1), ok(2), ok(3)]);
      expect(r.isOk()).toBe(true);
      expect(r.unwrap()).toEqual([1, 2, 3]);
    });

    it('returns first Err when any fails', () => {
      const r = collect([ok(1), err(new Error('fail')), ok(3)]);
      expect(r.isErr()).toBe(true);
    });

    it('returns Ok empty array for empty input', () => {
      const r = collect([]);
      expect(r.isOk()).toBe(true);
      expect(r.unwrap()).toEqual([]);
    });
  });

  describe('backwards compatibility', () => {
    it('Result<T> works with single type argument (E defaults to Error)', () => {
      const result: Result<{ name: string }> = ok({ name: 'test' });
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().name).toBe('test');
    });

    it('Result<T> error case works with single type argument', () => {
      const invalidResult: Result<{ name: string }> = err(new Error('invalid'));
      expect(invalidResult.isErr()).toBe(true);
      if (invalidResult.isErr()) {
        expect(invalidResult.error.message).toBe('invalid');
      }
    });

    it('unwrap() is available on Ok', () => {
      const r = ok(42);
      expect(typeof r.unwrap).toBe('function');
      expect(r.unwrap()).toBe(42);
    });

    it('unwrap() is available on Err and throws', () => {
      const r = err(new Error('test error'));
      expect(typeof r.unwrap).toBe('function');
      expect(() => r.unwrap()).toThrow('test error');
    });
  });
});
