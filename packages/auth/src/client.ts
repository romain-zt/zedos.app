/**
 * @repo/auth client — better-auth client for React components
 *
 * This module provides the auth client for use in client components.
 * Import { authClient } for client-side auth operations.
 */

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
