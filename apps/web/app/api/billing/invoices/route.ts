export const dynamic = 'force-dynamic';

import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { requireUser } from '@repo/auth/guards';
import { db, purchases, desc, eq, and } from '@repo/db';
import { ListBillingInvoicesResponseSchema } from '@repo/contracts/payments';
import { DrizzleAutoReloadRepository } from '@infrastructure/persistence/auto-reload-repository';

function stripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY;
  return secret ? new Stripe(secret) : null;
}

export async function GET() {
  const userResult = await requireUser(await headers());
  if (userResult.isErr()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = userResult.unwrap().id;
  const prefResult = await new DrizzleAutoReloadRepository().getByUserId(userId);
  if (prefResult.isErr()) {
    return NextResponse.json({ error: 'Failed to load payment profile' }, { status: 500 });
  }

  const customerId = prefResult.unwrap().stripeCustomerId;
  if (!customerId) {
    return NextResponse.json({ invoices: [] });
  }

  const stripe = stripeClient();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 30,
  });

  const invoiceDocuments = invoices.data.map((invoice) => ({
    id: invoice.id,
    documentType: 'invoice' as const,
    number: invoice.number,
    amountPaidCents: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status,
    createdAt: new Date(invoice.created * 1000).toISOString(),
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    invoicePdfUrl: invoice.invoice_pdf,
  }));

  const completedPurchases = await db
    .select({
      id: purchases.id,
      createdAt: purchases.createdAt,
      amountEur: purchases.amountEur,
      stripePaymentIntentId: purchases.stripePaymentIntentId,
    })
    .from(purchases)
    .where(and(eq(purchases.userId, userId), eq(purchases.status, 'completed')))
    .orderBy(desc(purchases.createdAt))
    .limit(30);

  const receiptDocuments = await Promise.all(
    completedPurchases.map(async (purchase) => {
      const paymentIntentId = purchase.stripePaymentIntentId;
      if (!paymentIntentId || paymentIntentId.length === 0) {
        return null;
      }

      try {
        const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
          expand: ['latest_charge'],
        });
        const latestCharge = intent.latest_charge;
        const receiptUrl =
          typeof latestCharge !== 'string' ? latestCharge?.receipt_url ?? null : null;

        if (!receiptUrl) {
          return null;
        }

        return {
          id: `receipt_${purchase.id}`,
          documentType: 'receipt' as const,
          number: null,
          amountPaidCents: purchase.amountEur * 100,
          currency: intent.currency,
          status: intent.status,
          createdAt: purchase.createdAt.toISOString(),
          hostedInvoiceUrl: receiptUrl,
          invoicePdfUrl: null,
        };
      } catch {
        return null;
      }
    })
  );

  const payload = ListBillingInvoicesResponseSchema.parse({
    invoices: [...invoiceDocuments, ...receiptDocuments.filter((doc) => doc != null)].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  });

  return NextResponse.json(payload);
}
