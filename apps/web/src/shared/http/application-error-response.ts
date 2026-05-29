import { NextResponse } from 'next/server';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'application-error-response' });

export function applicationErrorJson(error: ApplicationError): {
  error: string;
  details: ApplicationError['details'];
} {
  return {
    error: error.message,
    details: error.details,
  };
}

export function toNextErrorResponse(error: ApplicationError): NextResponse {
  return NextResponse.json(applicationErrorJson(error), { status: error.statusCode });
}

export function catchUnknownError(
  error: unknown,
  fallbackMessage: string
): NextResponse {
  logger.error(fallbackMessage, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
