import { Result, err, ok } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { TeamPlanDTO } from '@repo/contracts/team';
import type { ITeamPlanRepository } from '@domain/team/team-repository';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IProjectMemberRepository } from '@domain/collab/project-member-repository';
import { resolveProjectAccess } from '@application/collab/project-access';

export class GetTeamPlanUseCase {
  constructor(
    private teamPlanRepository: ITeamPlanRepository,
    private projectRepository: IProjectRepository,
    private memberRepository: IProjectMemberRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
  }): Promise<Result<TeamPlanDTO | null, ApplicationError>> {
    const access = await resolveProjectAccess(
      input.projectId,
      input.userId,
      this.projectRepository,
      this.memberRepository,
    );
    if (access.isErr()) return err(access.error);

    const plan = await this.teamPlanRepository.findByProject(input.projectId);
    if (plan.isErr()) return err(plan.error);
    return ok(plan.unwrap());
  }
}
