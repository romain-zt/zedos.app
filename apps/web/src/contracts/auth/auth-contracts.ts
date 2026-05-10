/**
 * Auth Contracts
 * 
 * Zod schemas for authentication requests, responses, and domain transfer objects.
 * Single source of truth for validation across API boundaries.
 */

import { z } from 'zod';

/**
 * SignUp Request Schema
 */
export const SignUpRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;

/**
 * SignIn Request Schema
 */
export const SignInRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInRequest = z.infer<typeof SignInRequestSchema>;

/**
 * User DTO Schema - sent to client after auth
 */
export const UserDTOSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  creditBalance: z.number(),
});

export type UserDTO = z.infer<typeof UserDTOSchema>;

/**
 * Auth Response Schema
 */
export const AuthResponseSchema = z.object({
  user: UserDTOSchema,
  message: z.string(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/**
 * Error Response Schema
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.record(z.any()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
