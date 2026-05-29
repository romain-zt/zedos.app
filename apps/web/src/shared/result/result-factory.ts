/**
 * Result Factory - ensures all errors are properly typed as ApplicationError
 */

import { Err, type Result } from '@repo/result';
import {
  ApplicationError,
  ErrorCode,
} from '@shared/errors/application-error';

/**
 * Safely wrap a result, converting Error to ApplicationError if needed
 */
export function ensureApplicationError<T>(
  result: Result<T, Error | ApplicationError>
): Result<T, ApplicationError> {
  if (result.isErr()) {
    const error = result.error;
    if (error instanceof ApplicationError) {
      return result as Result<T, ApplicationError>;
    }
    return new Err(
      new ApplicationError({
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
      })
    );
  }
  return result as Result<T, ApplicationError>;
}
