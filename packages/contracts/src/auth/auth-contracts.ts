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
  details: z.record(z.string(), z.array(z.string())).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const UpdateEmailRequestSchema = z.object({
  newEmail: z.string().email('Invalid email format'),
});

export type UpdateEmailRequest = z.infer<typeof UpdateEmailRequestSchema>;

export const UpdatePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  revokeOtherSessions: z.boolean().optional().default(true),
});

export type UpdatePasswordRequest = z.infer<typeof UpdatePasswordRequestSchema>;

export const UpdateConsentRequestSchema = z.object({
  marketingConsent: z.boolean(),
  productUpdatesConsent: z.boolean(),
});

export type UpdateConsentRequest = z.infer<typeof UpdateConsentRequestSchema>;

export const RevokeSessionRequestSchema = z.object({
  token: z.string().min(1, 'Session token is required'),
});

export type RevokeSessionRequest = z.infer<typeof RevokeSessionRequestSchema>;

export const DeleteAccountRequestSchema = z.object({
  password: z.string().min(1, 'Password is required').optional(),
});

export type DeleteAccountRequest = z.infer<typeof DeleteAccountRequestSchema>;

export const AccountActionResponseSchema = z.object({
  ok: z.boolean(),
  message: z.string(),
});

export type AccountActionResponse = z.infer<typeof AccountActionResponseSchema>;

export const UserSessionSchema = z.object({
  token: z.string(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.string(),
  current: z.boolean(),
});

export type UserSession = z.infer<typeof UserSessionSchema>;

export const ListSessionsResponseSchema = z.object({
  sessions: z.array(UserSessionSchema),
});

export type ListSessionsResponse = z.infer<typeof ListSessionsResponseSchema>;

export const PersonalDataExportResponseSchema = z.object({
  generatedAt: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    marketingConsent: z.boolean(),
    productUpdatesConsent: z.boolean(),
    consentUpdatedAt: z.string().nullable(),
  }),
  sessions: z.array(UserSessionSchema),
  credits: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      amount: z.number(),
      balanceAfter: z.number(),
      createdAt: z.string(),
    }),
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
});

export type PersonalDataExportResponse = z.infer<typeof PersonalDataExportResponseSchema>;
