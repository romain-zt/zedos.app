import type { IProjectRepository } from '@domain/project/project-repository';
import type {
  DriftSignal,
  DriftSignalStatus,
  IDriftSignalRepository,
} from '@domain/github';
import { Result, err } from '@repo/result';
import {
  ApplicationError,
  ForbiddenError,
  ValidationError,
} from '@shared/errors/application-error';

export type ResolveDriftAction = 'resolve' | 'dismiss' | 'reopen';

const ACTION_TO_STATUS: Record<ResolveDriftAction, DriftSignalStatus> = {
  resolve: 'resolved',
  dismiss: 'dismissed',
  reopen: 'open',
};

export class ResolveDriftSignalUseCase {
  constructor(
    private readonly projectRepository: IProjectRepository,
    private readonly driftSignalRepository: IDriftSignalRepository,
  ) {}

  async execute(
    projectId: string,
    signalId: string,
    userId: string,
    action: ResolveDriftAction,
  ): Promise<Result<DriftSignal, ApplicationError>> {
    if (!ACTION_TO_STATUS[action]) {
      return err(new ValidationError('Invalid drift action'));
    }
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }
    const project = projectResult.unwrap();
    if (project.userId !== userId) {
      return err(new ForbiddenError('Only the project owner can update drift signals'));
    }
    return this.driftSignalRepository.updateStatus(projectId, signalId, ACTION_TO_STATUS[action]);
  }
}
