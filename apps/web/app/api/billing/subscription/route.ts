export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireUser } from '@repo/auth/guards';
import { GetBillingSubscriptionUseCase } from '@application/subscription/get-billing-subscription-usecase';
import { DrizzleSubscriptionRepository } from '@infrastructure/persistence/subscription-repository';
import { BillingSubscriptionDTOSchema } from '@repo/contracts/payments';

export async function GET() {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = userResult.unwrap().id;

  const result = await new GetBillingSubscriptionUseCase(
    new DrizzleSubscriptionRepository(),
  ).execute(userId);

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }

  const parsed = BillingSubscriptionDTOSchema.safeParse(result.unwrap());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
  return NextResponse.json(parsed.data);
}
