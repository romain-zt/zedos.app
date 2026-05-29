/**
 * Result<T, E> type - explicit error handling without exceptions across boundaries.
 * Based on Rust's Result and Railway-Oriented Programming (ROP) patterns.
 *
 * - Ok(value): Represents successful computation
 * - Err(error): Represents failed computation
 *
 * Enforces explicit error handling and prevents unhandled exceptions from crossing layer boundaries.
 */

export type Result<T, E = Error> = Ok<T> | Err<E>;

export class Ok<T> {
  constructor(readonly value: T) {}

  isOk(): this is Ok<T> {
    return true;
  }

  isErr(): this is Err<never> {
    return false;
  }

  map<U>(fn: (value: T) => U): Result<U> {
    return new Ok(fn(this.value));
  }

  mapErr<E2>(_fn: (err: never) => E2): Result<T, E2> {
    return this;
  }

  flatMap<U, E2 = Error>(fn: (value: T) => Result<U, E2>): Result<U, E2> {
    return fn(this.value);
  }

  getOrElse(_defaultValue: T): T {
    return this.value;
  }

  unwrap(): T {
    return this.value;
  }
}

export class Err<E = Error> {
  constructor(readonly error: E) {}

  isOk(): this is Ok<never> {
    return false;
  }

  isErr(): this is Err<E> {
    return true;
  }

  map<U>(_fn: (value: never) => U): Result<U, E> {
    return this as Result<U, E>;
  }

  mapErr<E2>(fn: (err: E) => E2): Result<never, E2> {
    return new Err(fn(this.error));
  }

  flatMap<U, E2 = Error>(_fn: (value: never) => Result<U, E2>): Result<U, E | E2> {
    return this as Result<U, E | E2>;
  }

  getOrElse<T>(defaultValue: T): T {
    return defaultValue;
  }

  unwrap(): never {
    throw this.error;
  }
}

// Utility functions
export const ok = <T, E = Error>(value: T): Result<T, E> => new Ok(value);
export const err = <T = never, E = Error>(error: E): Result<T, E> => new Err(error);

/**
 * Combinator: collect results and return first error or array of successes
 */
export const collect = <T, E = Error>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (result.isErr()) {
      return result;
    }
    values.push(result.unwrap());
  }
  return ok<T[], E>(values);
};
