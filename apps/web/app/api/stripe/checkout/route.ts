export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, purchases, eq, sql, type PurchaseInsert } from '@repo/db'
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

    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const body = await request.json()
    const { packId } = body ?? {}

    const packs = getCreditPacks()
    const pack = packs.find((p: any) => p.id === packId)
    if (!pack) {
      return NextResponse.json({ error: 'Invalid pack' }, { status: 400 })
    }

    const origin = request.headers.get('origin') ?? ''

    const purchaseInsert: PurchaseInsert = { userId, packSize: pack.size, amountEur: pack.priceEur, status: 'pending' }
    const [purchase] = await db
      .insert(purchases)
      .values(purchaseInsert)
      .returning()

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
            unit_amount: pack.priceEur * 100,
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

    const sessionUpdate = sql`UPDATE purchases SET stripe_session_id = ${checkoutSession.id} WHERE id = ${purchase.id}`
    await db.execute(sessionUpdate)

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error?.message ?? 'Checkout failed' }, { status: 500 })
  }
}
