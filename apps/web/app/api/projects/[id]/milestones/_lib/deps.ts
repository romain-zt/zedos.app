import { milestoneRepository } from '@infrastructure/persistence/milestone-repository';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleProjectMemberRepository } from '@infrastructure/persistence/project-member-repository';

export function milestoneDeps() {
  return {
    milestoneRepository,
    projectRepository: new DrizzleProjectRepository(),
    memberRepository: new DrizzleProjectMemberRepository(),
  };
}
