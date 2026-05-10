// Result type
export { Ok, Err, ok, err, collect } from './result';
export type { Result } from './result';

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

// Events
export { EventBus, eventBus } from './events';
export type { DomainEvent, EventHandler } from './events';

// Mappers
export { Mapper, compose } from './mappers';
