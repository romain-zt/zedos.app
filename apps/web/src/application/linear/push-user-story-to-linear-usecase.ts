import type { IProjectRepository } from '@domain/project/project-repository';
import type {
  ILinearApiPort,
  ILinearConnectionRepository,
  ILinearIssueLinkRepository,
  LinearIssueLink,
} from '@domain/linear';
import { PushStoryToLinearRequestSchema } from '@repo/contracts/linear/push';
import { Result, err, ok } from '@repo/result';
import {
  ApplicationError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@shared/errors/application-error';

export class PushUserStoryToLinearUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly linearConnectionRepository: ILinearConnectionRepository,
    private readonly linearIssueLinkRepository: ILinearIssueLinkRepository,
    private readonly linearApi: ILinearApiPort,
  ) {}

  async execute(
    projectId: string,
    userId: string,
    rawRequest: unknown,
  ): Promise<Result<LinearIssueLink, ApplicationError>> {
    const parsed = PushStoryToLinearRequestSchema.safeParse(rawRequest);
    if (!parsed.success) {
      return err(new ValidationError('Invalid push request'));
    }
    const { userStoryLineId } = parsed.data;

    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }
    const project = projectResult.unwrap();
    if (project.userId !== userId) {
      return err(new ForbiddenError('Only the project owner can push stories to Linear'));
    }

    const existingLinkResult = await this.linearIssueLinkRepository.findByUserStoryLineId(
      userStoryLineId,
    );
    if (existingLinkResult.isErr()) {
      return err(existingLinkResult.error);
    }
    const existingLink = existingLinkResult.unwrap();
    if (existingLink && existingLink.projectId === projectId) {
      return ok(existingLink);
    }

    const connectionResult = await this.linearConnectionRepository.findByProjectId(projectId);
    if (connectionResult.isErr()) {
      return err(connectionResult.error);
    }
    const connection = connectionResult.unwrap();
    if (!connection || connection.status !== 'active') {
      return err(new NotFoundError('Linear connection is not active for this project'));
    }

    const lineResult = await this.linearIssueLinkRepository.findUserStoryLineForProject(
      projectId,
      userStoryLineId,
    );
    if (lineResult.isErr()) {
      return err(lineResult.error);
    }
    const line = lineResult.unwrap();
    if (!line) {
      return err(new NotFoundError('User story line not found for this project'));
    }

    const createResult = await this.linearApi.createIssue({
      teamId: connection.teamId,
      linearProjectId: connection.linearProjectId,
      title: line.title,
      description: line.body,
    });
    if (createResult.isErr()) {
      return err(createResult.error);
    }
    const created = createResult.unwrap();

    return this.linearIssueLinkRepository.insert({
      projectId,
      userStoryLineId,
      linearIssueId: created.linearIssueId,
      linearIssueIdentifier: created.linearIssueIdentifier,
      status: 'unknown',
    });
  }
}
