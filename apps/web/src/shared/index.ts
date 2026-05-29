// Error hierarchy
export {
  ApplicationError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  InsufficientCreditsError,
  ExternalServiceError,
  DatabaseError,
  ErrorCode,
} from './errors';
export type { ErrorContext } from './errors';

// Observability
export { Logger, createLogger } from './observability';
export type { LogLevel, LogContext } from './observability';

// Mappers
export { Mapper, compose } from './mappers';

// HTTP adapters
export { applicationErrorJson, toNextErrorResponse, catchUnknownError } from './http';

// Result helpers
export { forwardErr } from './result/propagate';
