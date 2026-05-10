export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { getCreditPacks } from '@/lib/config'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' as any })
  : null

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as any).id

    const body = await request.json()
    const { packId } = body ?? {}

    const packs = getCreditPacks()
    const pack = packs.find((p: any) => p.id === packId)
    if (!pack) {
      return NextResponse.json({ error: 'Invalid pack' }, { status: 400 })
    }

    const origin = request.headers.get('origin') ?? ''

    // Create purchase record
    const purchase = await prisma.purchase.create({
      data: {
        userId,
        packSize: pack.size,
        amountEur: pack.priceEur,
        status: 'pending',
      },
    })

    // Create Stripe Checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
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
            unit_amount: pack.priceEur * 100, // cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        purchaseId: purchase.id,
        packSize: String(pack.size),
      },
      success_url: `${origin}/dashboard/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard/credits?canceled=true`,
    })

    // Update purchase with stripe session id
    await prisma.purchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: checkoutSession.id },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error?.message ?? 'Checkout failed' }, { status: 500 })
  }
}
