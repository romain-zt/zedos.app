import { IPrdRepository } from '@domain/prd/prd-repository';
import { PrdVersion } from '@domain/prd/prd';
import { IProjectRepository } from '@domain/project/project-repository';
import { CreateOrCapturePrdVersionRequest } from '@repo/contracts/prd/prd-contracts';
import { Result, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';

export class EnsureFirstPrdVersionUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    input: CreateOrCapturePrdVersionRequest
  ): Promise<Result<{ created: boolean; version: PrdVersion }, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) {
      return err(projectResult.error);
    }

    const content = input.content ?? null;
    return this.prdRepository.ensureFirstVersion(projectId, content);
  }
}
