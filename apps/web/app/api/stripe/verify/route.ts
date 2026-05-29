export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { VerifySessionRequestSchema } from '@repo/contracts/payments'
import { verifyCheckoutSessionForUser } from '@infrastructure/payments/stripe-checkout-flows'

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }
  return fallback
}

export async function POST(request: NextRequest) {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const parsedBody = VerifySessionRequestSchema.safeParse(await request.json())
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }
    const { sessionId } = parsedBody.data

    const result = await verifyCheckoutSessionForUser({ userId, sessionId })
    if (result.ok === false) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result.value)
  } catch (error: unknown) {
    console.error('Stripe verify error:', error)
    return NextResponse.json({ error: errorMessage(error, 'Verification failed') }, { status: 500 })
  }
}
