import { Result, err, ok } from '@repo/result';
import { ApplicationError, NotFoundError } from '@shared/errors/application-error';
import type { JourneyStateDTO } from '@repo/contracts/project';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IProjectMemberRepository } from '@domain/collab/project-member-repository';
import type { IJourneyStateReader } from '@infrastructure/persistence/journey-state-reader';
import { resolveProjectAccess } from '@application/collab/project-access';

/** Returns the per-project journey counters powering the stepper + next-action UI. */
export class GetJourneyStateUseCase {
  constructor(
    private journeyStateReader: IJourneyStateReader,
    private projectRepository: IProjectRepository,
    private memberRepository: IProjectMemberRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
  }): Promise<Result<JourneyStateDTO, ApplicationError>> {
    const access = await resolveProjectAccess(
      input.projectId,
      input.userId,
      this.projectRepository,
      this.memberRepository,
    );
    if (access.isErr()) return err(access.error);

    const state = await this.journeyStateReader.read(input.projectId);
    if (state.isErr()) return err(state.error);
    const value = state.unwrap();
    if (!value) return err(new NotFoundError('Project not found'));
    return ok(value);
  }
}
