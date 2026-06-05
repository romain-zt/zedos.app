export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { CreateSubscriptionCheckoutRequestSchema } from '@repo/contracts/payments';
import { CreateSubscriptionCheckoutUseCase } from '@application/subscription/create-subscription-checkout-usecase';
import { AnalyticsEvents } from '@infrastructure/analytics/analytics-events';
import { captureServer } from '@infrastructure/analytics/posthog-server';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'stripe/subscription/checkout' });

export async function POST(request: NextRequest) {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = CreateSubscriptionCheckoutRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid checkout payload' }, { status: 400 });
  }

  const result = await new CreateSubscriptionCheckoutUseCase().execute({
    userId,
    planTier: parsed.data.planTier,
    origin: request.headers.get('origin') ?? '',
  });

  if (result.isErr()) {
    logger.warn('Builder checkout failed', { userId, status: result.error.statusCode });
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  captureServer(AnalyticsEvents.SUBSCRIPTION_CHECKOUT_STARTED, userId, {
    plan_tier: parsed.data.planTier,
  });
  return NextResponse.json(result.unwrap());
}
