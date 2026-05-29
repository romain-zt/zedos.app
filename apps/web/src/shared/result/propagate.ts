import { err, type Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';

/**
 * Propagate an Err from a narrower success type to a use-case return type.
 * Use when a repository returns Result<T, ApplicationError> but the use case
 * returns Result<U, ApplicationError>.
 */
export function forwardErr(
  result: Result<unknown, ApplicationError>
): Result<never, ApplicationError> {
  if (result.isErr()) {
    return err(result.error);
  }
  throw new Error('forwardErr called on Ok result');
}
