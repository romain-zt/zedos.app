import { Result, err } from '@repo/result';
import { ApplicationError } from '@shared/errors/application-error';
import type { IProjectMemberRepository } from '@domain/collab/project-member-repository';

export interface RevokeMemberInput {
  projectId: string;
  memberId: string;
  ownerUserId: string;
}

export class RevokeMemberUseCase {
  constructor(private readonly memberRepository: IProjectMemberRepository) {}

  async execute(input: RevokeMemberInput): Promise<Result<void, ApplicationError>> {
    const ownerCheck = await this.memberRepository.assertOwner(
      input.projectId,
      input.ownerUserId,
    );
    if (ownerCheck.isErr()) return err(ownerCheck.error);

    return this.memberRepository.revoke(input.projectId, input.memberId, input.ownerUserId);
  }
}
