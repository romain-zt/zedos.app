import { redirect } from 'next/navigation';

/**
 * Canonical sign-in URL for middleware redirects; reuses the existing login UI.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === 'string') {
      q.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) {
        q.append(key, v);
      }
    }
  }
  const suffix = q.toString() ? `?${q.toString()}` : '';
  redirect(`/login${suffix}`);
}
