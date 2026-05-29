import Stripe from 'stripe'
import { db, purchases, users, eq, sql, type PurchaseInsert } from '@repo/db'
import { addPurchaseCreditsForApi } from '@infrastructure/http/credits-http-bridge'
import {
  buildE2eCheckoutSessionId,
  isE2eMode,
  parseE2eCheckoutSessionId,
} from '@/lib/e2e-mode'

type FlowResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; error: string }

type CreateCheckoutInput = {
  userId: string
  packId: string
  origin: string
  packs: Array<{
    id: string
    size: number
    priceEur: number
    label: string
    description: string
  }>
}

type CreateCheckoutOutput = {
  url: string
}

type VerifyCheckoutInput = {
  userId: string
  sessionId: string
}

type VerifyCheckoutOutput = {
  balance: number
  creditsAdded?: number
  alreadyProcessed?: boolean
}

function stripeClient(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY
  return secret ? new Stripe(secret) : null
}

function getPaymentIntentId(paymentIntent: string | Stripe.PaymentIntent | null): string | null {
  return typeof paymentIntent === 'string' ? paymentIntent : null
}

export async function createCheckoutSessionForUser(
  input: CreateCheckoutInput
): Promise<FlowResult<CreateCheckoutOutput>> {
  const pack = input.packs.find((p) => p.id === input.packId)
  if (!pack) {
    return { ok: false, status: 400, error: 'Invalid pack' }
  }

  const purchaseInsert: PurchaseInsert = {
    userId: input.userId,
    packSize: pack.size,
    amountEur: pack.priceEur,
    status: 'pending',
  }
  const [purchase] = await db.insert(purchases).values(purchaseInsert).returning()

  if (isE2eMode()) {
    const sessionId = buildE2eCheckoutSessionId(purchase.id)
    await db.execute(sql`UPDATE purchases SET stripe_session_id = ${sessionId} WHERE id = ${purchase.id}`)
    const origin = input.origin.replace(/\/$/, '')
    return {
      ok: true,
      value: {
        url: `${origin}/dashboard/credits?success=true&session_id=${encodeURIComponent(sessionId)}`,
      },
    }
  }

  const stripe = stripeClient()
  if (!stripe) {
    return { ok: false, status: 503, error: 'Stripe is not configured' }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Zedos ${pack.label} Pack - ${pack.size} Credits`,
            description: pack.description,
          },
          unit_amount: pack.priceEur * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: input.userId,
      purchaseId: purchase.id,
      packSize: String(pack.size),
    },
    success_url: `${input.origin}/dashboard/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${input.origin}/dashboard/credits?canceled=true`,
  })

  await db.execute(sql`UPDATE purchases SET stripe_session_id = ${session.id} WHERE id = ${purchase.id}`)

  if (!session.url) {
    return { ok: false, status: 502, error: 'Stripe did not return checkout URL' }
  }

  return { ok: true, value: { url: session.url } }
}

export async function verifyCheckoutSessionForUser(
  input: VerifyCheckoutInput
): Promise<FlowResult<VerifyCheckoutOutput>> {
  const e2ePurchaseId = isE2eMode() ? parseE2eCheckoutSessionId(input.sessionId) : null
  if (e2ePurchaseId) {
    const [purchase] = await db.select().from(purchases).where(eq(purchases.id, e2ePurchaseId)).limit(1)
    if (!purchase || purchase.userId !== input.userId) {
      return { ok: false, status: 404, error: 'Purchase not found' }
    }

    if (purchase.status === 'completed') {
      const [user] = await db
        .select({ creditBalance: users.creditBalance })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1)
      return { ok: true, value: { balance: user?.creditBalance ?? 0, alreadyProcessed: true } }
    }

    const grantResult = await addPurchaseCreditsForApi(input.userId, purchase.packSize, {
      purchaseId: purchase.id,
      stripeSessionId: input.sessionId,
      packSize: purchase.packSize,
    })
    if (grantResult.isErr()) {
      return {
        ok: false,
        status: grantResult.error.statusCode ?? 500,
        error: grantResult.error.message,
      }
    }

    await db.execute(
      sql`UPDATE purchases SET status = 'completed', stripe_payment_intent_id = ${'pi_e2e_stub'} WHERE id = ${purchase.id}`
    )

    return {
      ok: true,
      value: { balance: grantResult.unwrap(), creditsAdded: purchase.packSize },
    }
  }

  const stripe = stripeClient()
  if (!stripe) {
    return { ok: false, status: 503, error: 'Stripe is not configured' }
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(input.sessionId)

  if (checkoutSession.payment_status !== 'paid') {
    return { ok: false, status: 400, error: 'Payment not completed' }
  }

  const purchaseId = checkoutSession.metadata?.purchaseId
  const packSize = parseInt(checkoutSession.metadata?.packSize ?? '0', 10)

  if (!purchaseId || !packSize) {
    return { ok: false, status: 400, error: 'Invalid session metadata' }
  }

  const [purchase] = await db.select().from(purchases).where(eq(purchases.id, purchaseId)).limit(1)
  if (!purchase) {
    return { ok: false, status: 404, error: 'Purchase not found' }
  }

  if (purchase.status === 'completed') {
    const [user] = await db
      .select({ creditBalance: users.creditBalance })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1)
    return { ok: true, value: { balance: user?.creditBalance ?? 0, alreadyProcessed: true } }
  }

  const grantResult = await addPurchaseCreditsForApi(input.userId, packSize, {
    purchaseId,
    stripeSessionId: input.sessionId,
    packSize,
  })
  if (grantResult.isErr()) {
    return {
      ok: false,
      status: grantResult.error.statusCode ?? 500,
      error: grantResult.error.message,
    }
  }

  await db.execute(
    sql`UPDATE purchases SET status = 'completed', stripe_payment_intent_id = ${getPaymentIntentId(checkoutSession.payment_intent)} WHERE id = ${purchaseId}`
  )

  return { ok: true, value: { balance: grantResult.unwrap(), creditsAdded: packSize } }
}
