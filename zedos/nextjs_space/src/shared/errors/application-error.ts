/**
 * Application Error Hierarchy
 * 
 * All errors crossing layer boundaries must be instances of ApplicationError or subclasses.
 * This ensures consistent error handling, logging, and HTTP status code mapping.
 * 
 * Rule: Never throw raw Error or unknown; always use typed errors from this module.
 */

export enum ErrorCode {
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Not Found
  NOT_FOUND = 'NOT_FOUND',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  PRD_NOT_FOUND = 'PRD_NOT_FOUND',
  ADR_NOT_FOUND = 'ADR_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Credits
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
  GRACE_PERIOD_EXCEEDED = 'GRACE_PERIOD_EXCEEDED',
  
  // External Service
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  PAYMENT_SERVICE_ERROR = 'PAYMENT_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  // Internal
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export interface ErrorContext {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

export class ApplicationError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details: Record<string, any>;

  constructor(context: ErrorContext) {
    super(context.message);
    this.code = context.code;
    this.statusCode = context.statusCode;
    this.details = context.details || {};
    Object.setPrototypeOf(this, ApplicationError.prototype);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super({
      code: ErrorCode.VALIDATION_ERROR,
      message,
      statusCode: 400,
      details,
    });
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.NOT_FOUND,
    details?: Record<string, any>
  ) {
    super({
      code,
      message,
      statusCode: 404,
      details,
    });
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized', details?: Record<string, any>) {
    super({
      code: ErrorCode.UNAUTHORIZED,
      message,
      statusCode: 401,
      details,
    });
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Forbidden', details?: Record<string, any>) {
    super({
      code: ErrorCode.FORBIDDEN,
      message,
      statusCode: 403,
      details,
    });
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class InsufficientCreditsError extends ApplicationError {
  constructor(required: number, available: number, details?: Record<string, any>) {
    super({
      code: ErrorCode.INSUFFICIENT_CREDITS,
      message: `Insufficient credits. Required: ${required}, Available: ${available}`,
      statusCode: 402, // Payment Required
      details: { required, available, ...details },
    });
    Object.setPrototypeOf(this, InsufficientCreditsError.prototype);
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(
    service: string,
    message: string,
    statusCode: number = 502,
    details?: Record<string, any>
  ) {
    const code =
      service === 'ai'
        ? ErrorCode.AI_SERVICE_ERROR
        : service === 'payment'
          ? ErrorCode.PAYMENT_SERVICE_ERROR
          : ErrorCode.INTERNAL_SERVER_ERROR;
    super({
      code,
      message: `${service.toUpperCase()} service error: ${message}`,
      statusCode,
      details: { service, ...details },
    });
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super({
      code: ErrorCode.DATABASE_ERROR,
      message: `Database error: ${message}`,
      statusCode: 500,
      details,
    });
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}