import type {
  DriftSignal,
  DriftSignalDraft,
  DriftSignalKind,
  DriftSignalSeverity,
  IDriftSignalRepository,
  IGithubConnectionRepository,
} from '@domain/github';
import { Result, err, ok } from '@repo/result';
import {
  ApplicationError,
  NotFoundError,
  ValidationError,
} from '@shared/errors/application-error';
import { GithubWebhookEnvelopeSchema } from '@repo/contracts/github/webhook';

export interface IngestGithubWebhookInput {
  readonly projectId: string;
  readonly eventType: string;
  readonly deliveryId: string;
  readonly rawPayload: unknown;
}

export interface IngestGithubWebhookOutput {
  readonly created: boolean;
  readonly signal: DriftSignal | null;
}

/**
 * v1 minimal: map every supported event to a DriftSignal stub. Real evaluation
 * is deferred to the evaluate-and-weekly-digest slice — this use case only
 * proves idempotency (one row per `(projectId, deliveryId)`) and authorization
 * (connection must exist).
 */
export class IngestGithubWebhookEventUseCase {
  constructor(
    private readonly githubConnectionRepository: IGithubConnectionRepository,
    private readonly driftSignalRepository: IDriftSignalRepository,
  ) {}

  async execute(
    input: IngestGithubWebhookInput,
  ): Promise<Result<IngestGithubWebhookOutput, ApplicationError>> {
    if (!input.deliveryId.trim()) {
      return err(new ValidationError('Missing GitHub delivery id'));
    }

    const connectionResult = await this.githubConnectionRepository.findByProjectId(input.projectId);
    if (connectionResult.isErr()) {
      return err(connectionResult.error);
    }
    const connection = connectionResult.unwrap();
    if (!connection || connection.status !== 'active') {
      return err(new NotFoundError('GitHub connection is not active for this project'));
    }

    const parsedPayload = GithubWebhookEnvelopeSchema.safeParse(input.rawPayload);
    if (!parsedPayload.success) {
      return err(new ValidationError('Invalid GitHub webhook payload'));
    }

    const draft: DriftSignalDraft = {
      projectId: input.projectId,
      kind: mapEventTypeToKind(input.eventType),
      severity: mapEventTypeToSeverity(input.eventType),
      summary: buildSummary(input.eventType, parsedPayload.data),
      payload: {
        eventType: input.eventType,
        action: parsedPayload.data.action ?? null,
        repository: parsedPayload.data.repository?.full_name ?? null,
        sender: parsedPayload.data.sender?.login ?? null,
      },
      source: 'webhook',
      externalDeliveryId: input.deliveryId,
    };

    const insertResult = await this.driftSignalRepository.insertIfAbsent(draft);
    if (insertResult.isErr()) {
      return err(insertResult.error);
    }
    const { created, signal } = insertResult.unwrap();
    return ok({ created, signal });
  }
}

function mapEventTypeToKind(eventType: string): DriftSignalKind {
  if (eventType === 'push') return 'DRIFT-01';
  if (eventType === 'release') return 'DRIFT-02';
  if (eventType === 'issues') return 'DRIFT-03';
  return 'DRIFT-04';
}

function mapEventTypeToSeverity(eventType: string): DriftSignalSeverity {
  if (eventType === 'release') return 'warn';
  return 'info';
}

interface SummaryEnvelope {
  readonly action?: string;
  readonly repository?: { readonly full_name?: string };
}

function buildSummary(eventType: string, envelope: SummaryEnvelope): string {
  const repo = envelope.repository?.full_name ?? 'unknown-repo';
  const action = envelope.action ? ` (${envelope.action})` : '';
  return `GitHub ${eventType}${action} on ${repo}`;
}
