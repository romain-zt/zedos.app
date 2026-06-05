import type { IProjectRepository } from '@domain/project/project-repository';
import type {
  ILinearConnectionRepository,
  LinearConnection,
} from '@domain/linear';
import { ConnectLinearRequestSchema } from '@repo/contracts/linear/connection';
import { Result, err } from '@repo/result';
import {
  ApplicationError,
  ForbiddenError,
  ValidationError,
} from '@shared/errors/application-error';

export class ConnectLinearUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly linearConnectionRepository: ILinearConnectionRepository,
  ) {}

  async execute(
    projectId: string,
    userId: string,
    rawRequest: unknown,
  ): Promise<Result<LinearConnection, ApplicationError>> {
    const parsed = ConnectLinearRequestSchema.safeParse(rawRequest);
    if (!parsed.success) {
      return err(new ValidationError('Invalid Linear connect request'));
    }

    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }
    const project = projectResult.unwrap();
    if (project.userId !== userId) {
      return err(new ForbiddenError('Only the project owner can connect Linear'));
    }

    return this.linearConnectionRepository.upsertActive({
      projectId,
      connectedByUserId: userId,
      teamId: parsed.data.teamId,
      linearProjectId: parsed.data.linearProjectId ?? null,
    });
  }
}
