import { describe, it, expect } from 'vitest';
import { ok, err, collect } from './result';

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
      expect(r.unwrap()).toBe(10);
    });

    it('flatMap chains results', () => {
      const r = ok(5).flatMap((x) => ok(x + 1));
      expect(r.unwrap()).toBe(6);
    });

    it('flatMap propagates error', () => {
      const r = ok(5).flatMap(() => err(new Error('fail')));
      expect(r.isErr()).toBe(true);
    });

    it('getOrElse returns value', () => {
      expect(ok(10).getOrElse(0)).toBe(10);
    });

    it('mapErr is no-op for Ok', () => {
      const r = ok(1).mapErr(() => new Error('mapped'));
      expect(r.isOk()).toBe(true);
      expect(r.unwrap()).toBe(1);
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

    it('getOrElse returns fallback', () => {
      const r = err<number, Error>(new Error('bad'));
      expect(r.getOrElse(99)).toBe(99);
    });

    it('map is no-op for Err', () => {
      const r = err(new Error('x')).map(() => 42);
      expect(r.isErr()).toBe(true);
    });

    it('mapErr transforms error', () => {
      const r = err(new Error('a')).mapErr(() => new Error('b'));
      expect(r.isErr()).toBe(true);
      expect(() => r.unwrap()).toThrow('b');
    });

    it('flatMap propagates error', () => {
      const r = err(new Error('nope')).flatMap(() => ok(1));
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
});
