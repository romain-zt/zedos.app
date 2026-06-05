export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  GITHUB_DELIVERY_HEADER,
  GITHUB_EVENT_HEADER,
  GITHUB_SIGNATURE_HEADER,
  GithubWebhookAckResponseSchema,
} from '@repo/contracts/github/webhook';
import { IngestGithubWebhookEventUseCase } from '@application/github/ingest-github-webhook-event-usecase';
import { githubConnectionRepository } from '@infrastructure/persistence/github-connection-repository';
import { driftSignalRepository } from '@infrastructure/persistence/drift-signal-repository';
import { verifyGithubWebhookSignature } from '@infrastructure/github/github-webhook-verify';
import { readGithubConfig } from '@infrastructure/github/github-config';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'github-webhook' });

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  const rawBody = await request.text();
  const signature = request.headers.get(GITHUB_SIGNATURE_HEADER);
  const deliveryId = request.headers.get(GITHUB_DELIVERY_HEADER) ?? '';
  const eventType = request.headers.get(GITHUB_EVENT_HEADER) ?? '';

  const config = readGithubConfig();
  const verified = verifyGithubWebhookSignature(rawBody, signature, config.webhookSecret);
  if (verified.isErr()) {
    logger.warn('GitHub webhook signature verification failed', {
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

  const useCase = new IngestGithubWebhookEventUseCase(
    githubConnectionRepository,
    driftSignalRepository,
  );
  const result = await useCase.execute({
    projectId,
    eventType,
    deliveryId,
    rawPayload: parsedPayload,
  });
  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }
  const { created, signal } = result.unwrap();
  const ack = GithubWebhookAckResponseSchema.safeParse({
    received: true,
    signalId: signal?.id ?? null,
    duplicate: !created,
  });
  if (!ack.success) {
    return NextResponse.json({ error: 'Internal validation error' }, { status: 500 });
  }
  return NextResponse.json(ack.data);
}
