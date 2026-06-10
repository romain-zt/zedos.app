import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type {
  CreateMilestoneRequest,
  MilestoneDTO,
  UpdateMilestoneRequest,
} from '@repo/contracts/planning';
import type { PlannedMilestoneDraft } from './distribute-plan';

export interface IMilestoneRepository {
  listByProject(projectId: string): Promise<Result<MilestoneDTO[], ApplicationError>>;
  create(
    projectId: string,
    input: CreateMilestoneRequest,
  ): Promise<Result<MilestoneDTO, ApplicationError>>;
  /** Bulk insert generated sprint drafts; returns rows in draft order. */
  createMany(
    projectId: string,
    drafts: PlannedMilestoneDraft[],
  ): Promise<Result<MilestoneDTO[], ApplicationError>>;
  update(
    milestoneId: string,
    projectId: string,
    patch: UpdateMilestoneRequest,
  ): Promise<Result<MilestoneDTO, ApplicationError>>;
  delete(milestoneId: string, projectId: string): Promise<Result<void, ApplicationError>>;
}
