import type {
  ILinearIssueLinkRepository,
  LinearIssueLink,
  LinearIssueLinkStatus,
} from '@domain/linear';
import { LinearWebhookEnvelopeSchema } from '@repo/contracts/linear/webhook';
import { Result, err, ok } from '@repo/result';
import {
  ApplicationError,
  ValidationError,
} from '@shared/errors/application-error';

export interface IngestLinearWebhookInput {
  readonly rawPayload: unknown;
  readonly deliveryId: string | null;
}

export interface IngestLinearWebhookOutput {
  readonly matchedLink: LinearIssueLink | null;
  readonly statusApplied: LinearIssueLinkStatus | null;
}

/**
 * v1 minimal status sync. Linear sends an envelope; if it carries an issue id
 * we know about, update the link status. Anything else acknowledges silently.
 */
export class IngestLinearWebhookEventUseCase {
  constructor(private readonly linearIssueLinkRepository: ILinearIssueLinkRepository) {}

  async execute(
    input: IngestLinearWebhookInput,
  ): Promise<Result<IngestLinearWebhookOutput, ApplicationError>> {
    const parsed = LinearWebhookEnvelopeSchema.safeParse(input.rawPayload);
    if (!parsed.success) {
      return err(new ValidationError('Invalid Linear webhook payload'));
    }
    const issueId = parsed.data.data?.id ?? null;
    if (!issueId) {
      return ok({ matchedLink: null, statusApplied: null });
    }

    const linkResult = await this.linearIssueLinkRepository.findByLinearIssueId(issueId);
    if (linkResult.isErr()) {
      return err(linkResult.error);
    }
    const link = linkResult.unwrap();
    if (!link) {
      return ok({ matchedLink: null, statusApplied: null });
    }

    const status = mapLinearStateTypeToStatus(parsed.data.data?.state?.type ?? null);
    const updateResult = await this.linearIssueLinkRepository.updateStatus(
      link.id,
      status,
      new Date(),
    );
    if (updateResult.isErr()) {
      return err(updateResult.error);
    }
    return ok({ matchedLink: updateResult.unwrap(), statusApplied: status });
  }
}

function mapLinearStateTypeToStatus(stateType: string | null): LinearIssueLinkStatus {
  switch (stateType) {
    case 'triage':
      return 'triage';
    case 'backlog':
      return 'backlog';
    case 'unstarted':
      return 'todo';
    case 'started':
      return 'in_progress';
    case 'completed':
      return 'done';
    case 'canceled':
      return 'canceled';
    default:
      return 'unknown';
  }
}
