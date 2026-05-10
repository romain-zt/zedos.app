import { IAdrRepository } from '@domain/adr/adr-repository';
import { IProjectRepository } from '@domain/project/project-repository';
import { Adr } from '@domain/adr/adr';
import { Result, err } from '@shared/result/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';

export class GetAdrUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private adrRepository: IAdrRepository
  ) {}

  async execute(projectId: string, userId: string, adrNumber: number): Promise<Result<Adr, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) return projectResult as any;

    const adrResult = await this.adrRepository.findByProjectIdAndNumber(projectId, adrNumber);
    if (adrResult.isErr()) return adrResult as any;

    const adr = adrResult.unwrap();
    if (!adr) return err(new NotFoundError('ADR not found'));
    return adrResult as any;
  }
}
