/**
 * @repo/auth types — Session and User type definitions
 *
 * These types are inferred from the better-auth instance configuration.
 * Session shape: session.user.id is string (not string | undefined)
 */

import type { auth } from './server';

export type Session = typeof auth.$Infer.Session;
export type User = Session['user'];

export interface UnauthorizedError extends Error {
  code: 'UNAUTHORIZED';
  statusCode: 401;
}

export function createUnauthorizedError(message: string): UnauthorizedError {
  const error = new Error(message) as UnauthorizedError;
  error.code = 'UNAUTHORIZED';
  error.statusCode = 401;
  error.name = 'UnauthorizedError';
  return error;
}

export interface ApiKey {
  id: string;
  name: string;
  userId: string;
  scopes: string[];
  expiresAt: Date | null;
  createdAt: Date;
}
