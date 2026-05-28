'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@repo/auth/server';

/**
 * Destroys the better-auth session server-side and redirects to the canonical
 * sign-in route (Slice 2: explicit sign-out server action).
 */
export async function signOutAction() {
  const h = await headers();
  await auth.api.signOut({ headers: h });
  redirect('/');
}
