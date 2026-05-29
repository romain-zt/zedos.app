import { err, type Result } from '@repo/result';
import { ApplicationError, ErrorCode } from '@shared/errors/application-error';

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
  return err(
    new ApplicationError({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'forwardErr called on Ok result',
      statusCode: 500,
    })
  );
}
