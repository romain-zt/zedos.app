export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { VerifySessionRequestSchema } from '@repo/contracts/payments/checkout';
import { requireUser } from '@repo/auth/guards';
import { db, purchases, users, eq, sql } from '@repo/db';
import { addPurchaseCreditsForApi } from '@infrastructure/http/credits-http-bridge';
import { retrieveCheckoutSessionForStripeVerify } from '@infrastructure/payments/stripe-checkout-session-retrieve';

export async function POST(request: NextRequest) {
  try {
    const userResult = await requireUser(headers());
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = userResult.unwrap().id;

    const rawBody = await request.json().catch(() => null);
    const parsedBody = VerifySessionRequestSchema.safeParse(rawBody ?? {});
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsedBody.error.flatten() },
        { status: 400 }
      );
    }
    const { sessionId } = parsedBody.data;

    const checkoutResult = await retrieveCheckoutSessionForStripeVerify(sessionId);
    if (checkoutResult.isErr()) {
      const e = checkoutResult.error;
      return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 502 });
    }
    const verifiedSession = checkoutResult.unwrap();

    const purchaseId = verifiedSession.metadata?.purchaseId;
    const packSize = parseInt(verifiedSession.metadata?.packSize ?? '0', 10);

    if (!purchaseId || !packSize) {
      return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 });
    }

    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1);

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    if (purchase.status === 'completed') {
      const [user] = await db
        .select({ creditBalance: users.creditBalance })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return NextResponse.json({ balance: user?.creditBalance ?? 0, alreadyProcessed: true });
    }

    const grantResult = await addPurchaseCreditsForApi(userId, packSize, {
      purchaseId,
      stripeSessionId: sessionId,
      packSize,
    });

    if (grantResult.isErr()) {
      return NextResponse.json(
        { error: grantResult.error.message },
        { status: grantResult.error.statusCode ?? 500 }
      );
    }

    const newBalance = grantResult.unwrap();
    const paymentIntent = verifiedSession.paymentIntentId;

    await db.execute(
      sql`UPDATE purchases SET status = 'completed', stripe_payment_intent_id = ${paymentIntent} WHERE id = ${purchaseId}`
    );

    return NextResponse.json({ balance: newBalance, creditsAdded: packSize });
  } catch (e: unknown) {
    console.error('Stripe verify error:', e);
    const msg = e instanceof Error ? e.message : 'Verification failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
