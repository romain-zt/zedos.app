import { Result, err } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type {
  CreateMilestoneRequest,
  MilestoneDTO,
  UpdateMilestoneRequest,
} from '@repo/contracts/planning';
import type { IMilestoneRepository } from '@domain/planning/milestone-repository';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IProjectMemberRepository } from '@domain/collab/project-member-repository';
import { resolveProjectAccess } from '@application/collab/project-access';

interface Deps {
  milestoneRepository: IMilestoneRepository;
  projectRepository: IProjectRepository;
  memberRepository: IProjectMemberRepository;
}

async function requireAccess(
  deps: Deps,
  projectId: string,
  userId: string,
): Promise<ApplicationError | null> {
  const access = await resolveProjectAccess(
    projectId,
    userId,
    deps.projectRepository,
    deps.memberRepository,
  );
  return access.isErr() ? access.error : null;
}

export class ListMilestonesUseCase {
  constructor(private deps: Deps) {}

  async execute(input: {
    projectId: string;
    userId: string;
  }): Promise<Result<MilestoneDTO[], ApplicationError>> {
    const accessError = await requireAccess(this.deps, input.projectId, input.userId);
    if (accessError) return err(accessError);
    return this.deps.milestoneRepository.listByProject(input.projectId);
  }
}

export class CreateMilestoneUseCase {
  constructor(private deps: Deps) {}

  async execute(input: {
    projectId: string;
    userId: string;
    milestone: CreateMilestoneRequest;
  }): Promise<Result<MilestoneDTO, ApplicationError>> {
    const accessError = await requireAccess(this.deps, input.projectId, input.userId);
    if (accessError) return err(accessError);
    return this.deps.milestoneRepository.create(input.projectId, input.milestone);
  }
}

export class UpdateMilestoneUseCase {
  constructor(private deps: Deps) {}

  async execute(input: {
    projectId: string;
    milestoneId: string;
    userId: string;
    patch: UpdateMilestoneRequest;
  }): Promise<Result<MilestoneDTO, ApplicationError>> {
    const accessError = await requireAccess(this.deps, input.projectId, input.userId);
    if (accessError) return err(accessError);
    return this.deps.milestoneRepository.update(input.milestoneId, input.projectId, input.patch);
  }
}

export class DeleteMilestoneUseCase {
  constructor(private deps: Deps) {}

  async execute(input: {
    projectId: string;
    milestoneId: string;
    userId: string;
  }): Promise<Result<void, ApplicationError>> {
    const accessError = await requireAccess(this.deps, input.projectId, input.userId);
    if (accessError) return err(accessError);
    return this.deps.milestoneRepository.delete(input.milestoneId, input.projectId);
  }
}
