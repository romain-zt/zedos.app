import { Result, err, ok } from '@repo/result';
import {
  ApplicationError,
  NotFoundError,
  ValidationError,
} from '@shared/errors/application-error';
import type { UpdatePrdSectionRequest } from '@repo/contracts/prd';
import {
  GeneratePrdAiResponseSchema,
  type GeneratePrdAiResponse,
} from '@repo/contracts/ai/generate-prd-stream';
import type { IPrdRepository } from '@domain/prd/prd-repository';
import type { PrdVersion } from '@domain/prd/prd';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IAgentActivityRepository } from '@domain/team/team-repository';
import { RecordAgentActivityUseCase } from '@application/team/record-agent-activity-usecase';

/**
 * Human edit of one PRD section:
 *   1. Verify project ownership
 *   2. Load the latest version and apply the section patch
 *   3. Insert a NEW version (status `edited`) — history stays immutable,
 *      and the next AI regeneration builds on the human's words
 *   4. Record a team-feed activity (free — no credits for human edits)
 */
export class UpdatePrdContentUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository,
    private activityRepository: IAgentActivityRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    patch: UpdatePrdSectionRequest;
  }): Promise<Result<PrdVersion, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(
      input.projectId,
      input.userId,
    );
    if (projectResult.isErr()) return err(projectResult.error);

    const latestResult = await this.prdRepository.findLatestByProjectId(input.projectId);
    if (latestResult.isErr()) return err(latestResult.error);
    const latest = latestResult.unwrap();
    if (!latest || !latest.content) {
      return err(new NotFoundError('No PRD to edit yet — generate one first'));
    }

    const patched = applySectionPatch(latest.content, input.patch);
    if (patched.isErr()) return err(patched.error);

    const inserted = await this.prdRepository.insertNextVersion({
      projectId: input.projectId,
      content: patched.unwrap(),
      status: 'edited',
      deliverableKind: latest.deliverableKind,
    });
    if (inserted.isErr()) return err(inserted.error);
    const version = inserted.unwrap();

    const activity = new RecordAgentActivityUseCase(this.activityRepository);
    const activityId = await activity.startSafe({
      projectId: input.projectId,
      kind: 'prd_edit',
      summary: `You edited the PRD — Nova saved it as v${version.versionNumber}`,
    });
    await activity.finishSafe(activityId, 'completed');

    return ok(version);
  }
}

/** Pure: applies a section content/title patch to a structured PRD body. */
export function applySectionPatch(
  content: unknown,
  patch: UpdatePrdSectionRequest,
): Result<GeneratePrdAiResponse, ApplicationError> {
  const structured = GeneratePrdAiResponseSchema.safeParse(content);
  if (!structured.success) {
    return err(
      new ValidationError('This PRD version has no editable sections yet — generate a full PRD first'),
    );
  }

  const sectionIndex = structured.data.sections.findIndex(
    (section) => section.id === patch.sectionId,
  );
  if (sectionIndex === -1) {
    return err(new NotFoundError('PRD section not found'));
  }

  const sections = structured.data.sections.map((section, index) =>
    index === sectionIndex
      ? {
          ...section,
          content: patch.content,
          ...(patch.title ? { title: patch.title } : {}),
        }
      : section,
  );

  return ok({ ...structured.data, sections });
}
