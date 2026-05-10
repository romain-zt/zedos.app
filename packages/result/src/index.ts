/**
 * @repo/result — neverthrow-backed Result<T,E> with backwards-compatible API
 *
 * This package wraps neverthrow to provide:
 * - Result<T, E = Error> with default error type
 * - unwrap() method on Ok/Err (neverthrow uses _unsafeUnwrap())
 * - collect() combinator for aggregating Results
 *
 * NOTE: Phase 3 replaces the local Result implementation with neverthrow
 */

import {
  Ok as NeverthrowOk,
  Err as NeverthrowErr,
  Result as NeverthrowResult,
  ResultAsync,
  fromThrowable,
  fromPromise,
  fromSafePromise,
} from 'neverthrow';

/**
 * Extended Ok class with unwrap() method for backwards compatibility
 */
export class Ok<T, E = Error> extends NeverthrowOk<T, E> {
  constructor(value: T) {
    super(value);
  }

  /**
   * Backwards-compatible unwrap() — returns the value or throws if Err
   */
  unwrap(): T {
    return this.value;
  }
}

/**
 * Extended Err class with unwrap() method for backwards compatibility
 */
export class Err<T, E = Error> extends NeverthrowErr<T, E> {
  constructor(error: E) {
    super(error);
  }

  /**
   * Backwards-compatible unwrap() — throws the error
   */
  unwrap(): never {
    throw this.error;
  }
}

/**
 * Result type with default error type for backwards compatibility
 * Allows both Result<T> and Result<T, E> usage
 */
export type Result<T, E = Error> = Ok<T, E> | Err<T, E>;

/**
 * Factory function for creating Ok results
 */
export function ok<T, E = Error>(value: T): Result<T, E> {
  return new Ok<T, E>(value);
}

/**
 * Factory function for creating Err results
 */
export function err<T = never, E = Error>(error: E): Result<T, E> {
  return new Err<T, E>(error);
}

/**
 * Collect an array of Results into a Result of array
 * Returns the first error encountered, or Ok with all values
 */
export function collect<T, E = Error>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (result.isErr()) {
      return result as unknown as Result<T[], E>;
    }
    values.push(result.unwrap());
  }
  return ok(values);
}

// Re-export useful neverthrow utilities
export { ResultAsync, fromThrowable, fromPromise, fromSafePromise };
