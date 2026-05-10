import { IAdrRepository } from '@domain/adr/adr-repository';
import { IProjectRepository } from '@domain/project/project-repository';
import { Adr } from '@domain/adr/adr';
import { Result } from '@shared/result/result';
import { ApplicationError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ operation: 'UpdateAdrUseCase' });

export interface UpdateAdrInput {
  projectId: string;
  userId: string;
  adrNumber: number;
  title?: string;
  content?: string;
  status?: string;
}

export class UpdateAdrUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private adrRepository: IAdrRepository
  ) {}

  async execute(input: UpdateAdrInput): Promise<Result<Adr, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(input.projectId, input.userId);
    if (projectResult.isErr()) return projectResult as any;

    const result = await this.adrRepository.update(input.projectId, input.adrNumber, {
      title: input.title,
      content: input.content,
      status: input.status,
    });

    if (result.isOk()) {
      logger.info('ADR updated', { projectId: input.projectId, adrNumber: input.adrNumber });
    }
    return result;
  }
}
