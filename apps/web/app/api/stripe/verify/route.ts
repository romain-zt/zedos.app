export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, purchases, users, eq, sql } from '@repo/db'
import { addCredits } from '@/lib/credits'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' as any })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
    }

    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const body = await request.json()
    const { sessionId } = body ?? {}

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    const purchaseId = checkoutSession.metadata?.purchaseId
    const packSize = parseInt(checkoutSession.metadata?.packSize ?? '0', 10)

    if (!purchaseId || !packSize) {
      return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 })
    }

    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, purchaseId))
      .limit(1)

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }

    if (purchase.status === 'completed') {
      const [user] = await db
        .select({ creditBalance: users.creditBalance })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
      return NextResponse.json({ balance: user?.creditBalance ?? 0, alreadyProcessed: true })
    }

    const newBalance = await addCredits(userId, packSize, 'purchase', {
      purchaseId,
      stripeSessionId: sessionId,
      packSize,
    })

    const paymentIntent = (checkoutSession as any).payment_intent as string | null ?? null
    await db.execute(
      sql`UPDATE purchases SET status = 'completed', stripe_payment_intent_id = ${paymentIntent} WHERE id = ${purchaseId}`
    )

    return NextResponse.json({ balance: newBalance, creditsAdded: packSize })
  } catch (error: any) {
    console.error('Stripe verify error:', error)
    return NextResponse.json({ error: error?.message ?? 'Verification failed' }, { status: 500 })
  }
}
