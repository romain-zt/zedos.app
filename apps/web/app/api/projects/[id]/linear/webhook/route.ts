export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  LINEAR_DELIVERY_HEADER,
  LINEAR_SIGNATURE_HEADER,
  LinearWebhookAckResponseSchema,
} from '@repo/contracts/linear/webhook';
import { IngestLinearWebhookEventUseCase } from '@application/linear/ingest-linear-webhook-event-usecase';
import { linearIssueLinkRepository } from '@infrastructure/persistence/linear-issue-link-repository';
import { verifyLinearWebhookSignature } from '@infrastructure/linear/linear-webhook-verify';
import { readLinearConfig } from '@infrastructure/linear/linear-config';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'linear-webhook' });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  const rawBody = await request.text();
  const signature = request.headers.get(LINEAR_SIGNATURE_HEADER);
  const deliveryId = request.headers.get(LINEAR_DELIVERY_HEADER);

  const config = readLinearConfig();
  const verified = verifyLinearWebhookSignature(rawBody, signature, config.webhookSecret);
  if (verified.isErr()) {
    logger.warn('Linear webhook signature verification failed', {
      projectId,
      statusCode: verified.error.statusCode,
    });
    return NextResponse.json(
      { error: verified.error.message },
      { status: verified.error.statusCode },
    );
  }

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const useCase = new IngestLinearWebhookEventUseCase(linearIssueLinkRepository);
  const result = await useCase.execute({ rawPayload: parsedPayload, deliveryId });
  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }
  const { matchedLink } = result.unwrap();
  const ack = LinearWebhookAckResponseSchema.safeParse({
    received: true,
    matchedLinkId: matchedLink?.id ?? null,
  });
  if (!ack.success) {
    return NextResponse.json({ error: 'Internal validation error' }, { status: 500 });
  }
  return NextResponse.json(ack.data);
}
