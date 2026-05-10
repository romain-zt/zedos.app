export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { PrismaCreditsRepository } from '@/src/infrastructure/persistence/credits-repository'
import { PrismaProcessedWebhookEventRepository } from '@/src/infrastructure/persistence/processed-webhook-event-repository'
import { ProcessStripeWebhookEventUseCase } from '@/src/application/payments/process-stripe-webhook-event-usecase'
import { createLogger } from '@/src/shared/observability/logger'

const logger = createLogger({ route: '/api/stripe/webhook' })

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' as any })
  : null

export async function POST(request: NextRequest) {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    logger.error('Stripe webhook misconfiguration: STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET missing')
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    logger.warn('Stripe webhook: missing Stripe-Signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
  } catch (e: any) {
    logger.warn('Stripe webhook: invalid signature', { error: e?.message })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const creditsRepo = new PrismaCreditsRepository(prisma)
  const webhookRepo = new PrismaProcessedWebhookEventRepository(prisma)
  const useCase = new ProcessStripeWebhookEventUseCase(creditsRepo, webhookRepo, prisma)

  const result = await useCase.execute({ rawEventPayload: event })

  if (result.isErr()) {
    logger.error('Stripe webhook processing failed', { eventId: event.id, error: result.error.message })
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true, idempotent: result.unwrap().idempotent })
}
