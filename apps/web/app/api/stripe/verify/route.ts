export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth'
import { prisma } from '@/lib/prisma'
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

    // Check if already processed
    const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } })
    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
    }
    if (purchase.status === 'completed') {
      // Already processed
      const user = await prisma.user.findUnique({ where: { id: userId } })
      return NextResponse.json({ balance: user?.creditBalance ?? 0, alreadyProcessed: true })
    }

    // Add credits
    const newBalance = await addCredits(userId, packSize, 'purchase', {
      purchaseId,
      stripeSessionId: sessionId,
      packSize,
    })

    // Update purchase status
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: 'completed',
        stripePaymentIntentId: (checkoutSession as any).payment_intent as string ?? null,
      },
    })

    return NextResponse.json({ balance: newBalance, creditsAdded: packSize })
  } catch (error: any) {
    console.error('Stripe verify error:', error)
    return NextResponse.json({ error: error?.message ?? 'Verification failed' }, { status: 500 })
  }
}
