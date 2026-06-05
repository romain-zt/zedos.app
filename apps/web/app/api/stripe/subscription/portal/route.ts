export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { OpenCustomerPortalUseCase } from '@application/subscription/open-customer-portal-usecase';
import { DrizzleSubscriptionRepository } from '@infrastructure/persistence/subscription-repository';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'stripe/subscription/portal' });

export async function POST(request: NextRequest) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const origin = request.headers.get('origin') ?? '';
  const returnUrl = `${origin}/dashboard/billing`;

  const result = await new OpenCustomerPortalUseCase(
    new DrizzleSubscriptionRepository(),
  ).execute({ userId, returnUrl });

  if (result.isErr()) {
    logger.warn('Portal session failed', { userId, status: result.error.statusCode });
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  captureServer(AnalyticsEvents.CUSTOMER_PORTAL_OPENED, userId, {});
  return NextResponse.json(result.unwrap());
}
