import { ticketRepository } from '@infrastructure/persistence/ticket-repository';
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository';
import { DrizzleProjectMemberRepository } from '@infrastructure/persistence/project-member-repository';

export function ticketDeps() {
  return {
    ticketRepository,
    projectRepository: new DrizzleProjectRepository(),
    memberRepository: new DrizzleProjectMemberRepository(),
  };
}
