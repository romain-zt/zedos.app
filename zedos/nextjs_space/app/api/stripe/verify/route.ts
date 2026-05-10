export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { VerifySessionRequestSchema, VerifySessionResponseSchema } from '@/src/contracts/payments/checkout'

/**
 * POST /api/stripe/verify
 *
 * Confirmation-only — reads Purchase.status but NEVER grants credits.
 * Credits are granted exclusively by the Stripe webhook handler (/api/stripe/webhook).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const body = await request.json()
  const parsed = VerifySessionRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { sessionId } = parsed.data

  const purchase = await prisma.purchase.findFirst({
    where: { stripeSessionId: sessionId, userId },
  })

  if (!purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })

  const dto = VerifySessionResponseSchema.safeParse({
    status: purchase.status === 'completed' ? 'completed' : purchase.status === 'failed' ? 'failed' : 'processing',
    balance: purchase.status === 'completed' ? (user?.creditBalance ?? 0) : undefined,
  })

  if (!dto.success) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(dto.data)
}
