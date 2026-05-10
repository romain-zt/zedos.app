/**
 * Result Factory - ensures all errors are properly typed as ApplicationError
 */

import { Ok, Err, Result } from './result';
import { ApplicationError } from '@shared/errors/application-error';

/**
 * Safely wrap a result, converting Error to ApplicationError if needed
 */
export function ensureApplicationError<T>(result: Result<T, any>): Result<T, ApplicationError> {
  if (result.isErr()) {
    const error = result.error;
    if (error instanceof ApplicationError) {
      return result as Result<T, ApplicationError>;
    }
    return new Err(
      new ApplicationError({
        code: 'INTERNAL_SERVER_ERROR' as any,
        message: error?.message || 'Unknown error',
        statusCode: 500,
      })
    ) as any;
  }
  return result as any;
}
