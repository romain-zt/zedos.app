import { Result, err } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';
import type { IProjectMemberRepository } from '@domain/collab/project-member-repository';
import {
  COMMENTER_ACTIVE_CAP,
  type ProjectMemberDTO,
} from '@repo/contracts/project/members';

export interface InviteCommenterInput {
  projectId: string;
  ownerUserId: string;
  inviteEmail: string;
}

export class InviteCommenterUseCase {
  constructor(private readonly memberRepository: IProjectMemberRepository) {}

  async execute(
    input: InviteCommenterInput,
  ): Promise<Result<ProjectMemberDTO, ApplicationError>> {
    const ownerCheck = await this.memberRepository.assertOwner(
      input.projectId,
      input.ownerUserId,
    );
    if (ownerCheck.isErr()) return err(ownerCheck.error);

    const countResult = await this.memberRepository.countActiveCommenters(input.projectId);
    if (countResult.isErr()) return err(countResult.error);

    if (countResult.unwrap() >= COMMENTER_ACTIVE_CAP) {
      return err(
        new ValidationError(
          `Commenter limit reached (${COMMENTER_ACTIVE_CAP}). Revoke a commenter before inviting another.`,
        ),
      );
    }

    return this.memberRepository.invite(
      input.projectId,
      input.ownerUserId,
      input.inviteEmail,
      'commenter',
    );
  }
}
