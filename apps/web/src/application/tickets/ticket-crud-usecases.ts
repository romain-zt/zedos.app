import { Result, err, ok } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type {
  CreateTicketRequest,
  TicketDTO,
  UpdateTicketRequest,
} from '@repo/contracts/tickets';
import type { ITicketRepository } from '@domain/tickets/ticket-repository';
import type { IProjectRepository } from '@domain/project/project-repository';
import type { IProjectMemberRepository } from '@domain/collab/project-member-repository';
import { resolveProjectAccess } from '@application/collab/project-access';

interface Deps {
  ticketRepository: ITicketRepository;
  projectRepository: IProjectRepository;
  memberRepository: IProjectMemberRepository;
}

async function requireAccess(
  deps: Deps,
  projectId: string,
  userId: string,
): Promise<Result<void, ApplicationError>> {
  const access = await resolveProjectAccess(
    projectId,
    userId,
    deps.projectRepository,
    deps.memberRepository,
  );
  if (access.isErr()) return err(access.error);
  return ok(undefined);
}

export class ListTicketsUseCase {
  constructor(private deps: Deps) {}

  async execute(input: {
    projectId: string;
    userId: string;
  }): Promise<Result<TicketDTO[], ApplicationError>> {
    const access = await requireAccess(this.deps, input.projectId, input.userId);
    if (access.isErr()) return err(access.error);
    return this.deps.ticketRepository.listByProject(input.projectId);
  }
}

export class CreateTicketUseCase {
  constructor(private deps: Deps) {}

  async execute(input: {
    projectId: string;
    userId: string;
    ticket: CreateTicketRequest;
  }): Promise<Result<TicketDTO, ApplicationError>> {
    const access = await requireAccess(this.deps, input.projectId, input.userId);
    if (access.isErr()) return err(access.error);
    return this.deps.ticketRepository.create(input.projectId, input.ticket);
  }
}

export class UpdateTicketUseCase {
  constructor(private deps: Deps) {}

  async execute(input: {
    projectId: string;
    ticketId: string;
    userId: string;
    patch: UpdateTicketRequest;
  }): Promise<Result<TicketDTO, ApplicationError>> {
    const access = await requireAccess(this.deps, input.projectId, input.userId);
    if (access.isErr()) return err(access.error);
    return this.deps.ticketRepository.update(input.ticketId, input.projectId, input.patch);
  }
}

export class DeleteTicketUseCase {
  constructor(private deps: Deps) {}

  async execute(input: {
    projectId: string;
    ticketId: string;
    userId: string;
  }): Promise<Result<void, ApplicationError>> {
    const access = await requireAccess(this.deps, input.projectId, input.userId);
    if (access.isErr()) return err(access.error);
    return this.deps.ticketRepository.delete(input.ticketId, input.projectId);
  }
}
