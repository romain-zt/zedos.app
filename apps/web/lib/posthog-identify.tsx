'use client';

import { useEffect, useRef } from 'react';
import { useSession } from '@repo/auth';
import { identifyClient } from '@infrastructure/analytics/posthog-client';

/** Identify signed-in owners once per session (no PII in person properties). */
export function PostHogIdentify() {
  const { data: session } = useSession();
  const lastIdentifiedId = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || lastIdentifiedId.current === userId) return;
    lastIdentifiedId.current = userId;
    identifyClient(userId);
  }, [session?.user?.id]);

  return null;
}
