import type { Result } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type {
  CreateTicketRequest,
  TicketDTO,
  UpdateTicketRequest,
} from '@repo/contracts/tickets';

export interface TicketSeedSource {
  title: string;
  description: string;
  assigneeRole: string | null;
  userStoryLineId: string | null;
  taskSplitTaskId: string | null;
}

/** Reads ticket seeds from the delivery plan (task-split tasks, user-story lines). */
export interface ITicketSeedSourceReader {
  /** Task-split tasks (preferred source) for the project, with story context. */
  readTaskSplitSources(projectId: string): Promise<Result<TicketSeedSource[], ApplicationError>>;
  /** User-story lines fallback when no task split exists yet. */
  readUserStorySources(projectId: string): Promise<Result<TicketSeedSource[], ApplicationError>>;
}

export interface ITicketRepository {
  listByProject(projectId: string): Promise<Result<TicketDTO[], ApplicationError>>;
  findById(ticketId: string): Promise<Result<TicketDTO | null, ApplicationError>>;
  /** Allocates the next per-project number inside a transaction. */
  create(
    projectId: string,
    input: CreateTicketRequest,
  ): Promise<Result<TicketDTO, ApplicationError>>;
  /** Bulk create with per-project number allocation; skips sources already linked. */
  createFromSources(
    projectId: string,
    sources: TicketSeedSource[],
  ): Promise<Result<{ created: TicketDTO[]; skipped: number }, ApplicationError>>;
  update(
    ticketId: string,
    projectId: string,
    patch: UpdateTicketRequest,
  ): Promise<Result<TicketDTO, ApplicationError>>;
  /** Assigns many tickets to milestones (plan generation) in one transaction. */
  bulkAssign(
    projectId: string,
    assignments: Array<{ ticketId: string; milestoneId: string; dueDate: string | null }>,
  ): Promise<Result<void, ApplicationError>>;
  delete(ticketId: string, projectId: string): Promise<Result<void, ApplicationError>>;
}
