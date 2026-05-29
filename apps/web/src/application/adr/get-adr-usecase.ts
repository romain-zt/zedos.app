import { IAdrRepository } from '@domain/adr/adr-repository';
import { IProjectRepository } from '@domain/project/project-repository';
import { Adr } from '@domain/adr/adr';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';
import { forwardErr } from '@shared/result/propagate';

export class GetAdrUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private adrRepository: IAdrRepository
  ) {}

  async execute(
    projectId: string,
    userId: string,
    adrNumber: number
  ): Promise<Result<Adr, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(projectId, userId);
    if (projectResult.isErr()) return forwardErr(projectResult);

    const adrResult = await this.adrRepository.findByProjectIdAndNumber(projectId, adrNumber);
    if (adrResult.isErr()) return forwardErr(adrResult);

    const adr = adrResult.unwrap();
    if (!adr) return err(new NotFoundError('ADR not found'));
    return ok(adr);
  }
}
