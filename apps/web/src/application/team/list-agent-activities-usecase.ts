import { Result, err, ok } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { AgentActivityDTO } from '@repo/contracts/team';
import type { IAgentActivityRepository } from '@domain/team/team-repository';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IProjectMemberRepository } from '@domain/collab/project-member-repository';
import { resolveProjectAccess } from '@application/collab/project-access';

export class ListAgentActivitiesUseCase {
  constructor(
    private activityRepository: IAgentActivityRepository,
    private projectRepository: IProjectRepository,
    private memberRepository: IProjectMemberRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    limit?: number;
  }): Promise<Result<AgentActivityDTO[], ApplicationError>> {
    const access = await resolveProjectAccess(
      input.projectId,
      input.userId,
      this.projectRepository,
      this.memberRepository,
    );
    if (access.isErr()) return err(access.error);

    const listResult = await this.activityRepository.listByProject(
      input.projectId,
      input.limit ?? 50,
    );
    if (listResult.isErr()) return err(listResult.error);
    return ok(listResult.unwrap());
  }
}
