import { Result, err, ok } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';
import type { TeamPlanDTO } from '@repo/contracts/team';
import type {
  IAgentActivityRepository,
  ITeamPlanGenerator,
  ITeamPlanRepository,
} from '@domain/team/team-repository';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IPrdRepository } from '@domain/prd/prd-repository';
import type { IFeatureSplitRepository } from '@domain/feature-split/feature-split-repository';
import { RecordAgentActivityUseCase } from './record-agent-activity-usecase';

export interface GenerateTeamPlanInput {
  projectId: string;
  userId: string;
}

/**
 * Scout (talent scout) builds the team & skills plan for a project:
 *   1. Verify project ownership
 *   2. Load latest PRD + confirmed feature-split labels as context
 *   3. Record agent activity (running)
 *   4. Generate plan (AI with deterministic fallback inside the adapter)
 *   5. Upsert plan, mark activity completed/failed
 */
export class GenerateTeamPlanUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private prdRepository: IPrdRepository,
    private featureSplitRepository: IFeatureSplitRepository,
    private teamPlanRepository: ITeamPlanRepository,
    private generator: ITeamPlanGenerator,
    private activityRepository: IAgentActivityRepository,
  ) {}

  async execute(input: GenerateTeamPlanInput): Promise<Result<TeamPlanDTO, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(
      input.projectId,
      input.userId,
    );
    if (projectResult.isErr()) return err(projectResult.error);
    const project = projectResult.unwrap();
    if (!project) return err(new NotFoundError('Project not found'));

    const context = await this.loadContext(input.projectId);

    const activity = new RecordAgentActivityUseCase(this.activityRepository);
    const activityId = await activity.startSafe({
      projectId: input.projectId,
      kind: 'team_plan',
      summary: `Scout is assembling the team plan for "${project.name}"`,
    });

    const planResult = await this.generator.generate({
      projectName: project.name,
      projectDescription: project.description ?? null,
      prdText: context.prdText,
      clusterLabels: context.clusterLabels,
    });
    if (planResult.isErr()) {
      await activity.finishSafe(activityId, 'failed', 'Scout could not assemble the team plan');
      return err(planResult.error);
    }

    const saved = await this.teamPlanRepository.upsert(input.projectId, planResult.unwrap());
    if (saved.isErr()) {
      await activity.finishSafe(activityId, 'failed', 'Saving the team plan failed');
      return err(saved.error);
    }

    await activity.finishSafe(
      activityId,
      'completed',
      `Scout assembled the team plan for "${project.name}"`,
    );
    return ok(saved.unwrap());
  }

  private async loadContext(
    projectId: string,
  ): Promise<{ prdText: string; clusterLabels: string[] }> {
    let prdText = '';
    const latestPrd = await this.prdRepository.findLatestByProjectId(projectId);
    if (latestPrd.isOk()) {
      const version = latestPrd.unwrap();
      if (version?.content) {
        prdText = JSON.stringify(version.content).slice(0, 20_000);
      }
    }

    let clusterLabels: string[] = [];
    const splits = await this.featureSplitRepository.findByProjectId(projectId);
    if (splits.isOk()) {
      const confirmed =
        splits.unwrap().find((s) => s.status === 'confirmed') ?? splits.unwrap()[0];
      clusterLabels = (confirmed?.clusters ?? []).map((c) => c.label);
    }

    return { prdText, clusterLabels };
  }
}
