import { err, ok, type Result } from '@repo/result';
import { ExternalServiceError, ForbiddenError } from '@shared/errors/application-error';
import type {
  MilestoneFeedbackRowDTO,
  MilestoneFeedbackSubmitRequest,
} from '@repo/contracts/feedback/submit';

export interface CaptureMilestoneFeedbackInput {
  userId: string;
  request: MilestoneFeedbackSubmitRequest;
}

export interface CaptureMilestoneFeedbackRepository {
  isProjectOwnedByUser(projectId: string, userId: string): Promise<boolean>;
  findDuplicate(
    userId: string,
    projectId: string,
    milestoneType: string,
    prdVersionId: string | null
  ): Promise<boolean>;
  createFeedback(
    userId: string,
    request: MilestoneFeedbackSubmitRequest
  ): Promise<Result<MilestoneFeedbackRowDTO, ExternalServiceError>>;
}

export type CaptureMilestoneFeedbackOutput =
  | { kind: 'created'; row: MilestoneFeedbackRowDTO }
  | { kind: 'duplicate'; message: string };

export class CaptureMilestoneFeedbackUseCase {
  constructor(private readonly repository: CaptureMilestoneFeedbackRepository) {}

  async execute(
    input: CaptureMilestoneFeedbackInput
  ): Promise<Result<CaptureMilestoneFeedbackOutput, ForbiddenError | ExternalServiceError>> {
    const ownsProject = await this.repository.isProjectOwnedByUser(
      input.request.projectId,
      input.userId
    );
    if (!ownsProject) {
      return err(new ForbiddenError('You do not own this project'));
    }

    const prdVersionId = input.request.prdVersionId ?? null;
    const isDuplicate = await this.repository.findDuplicate(
      input.userId,
      input.request.projectId,
      input.request.milestoneType,
      prdVersionId
    );
    if (isDuplicate) {
      return ok({ kind: 'duplicate', message: 'Feedback already submitted' });
    }

    const created = await this.repository.createFeedback(input.userId, input.request);
    if (created.isErr()) return err(created.error);
    return ok({ kind: 'created', row: created.unwrap() });
  }
}
