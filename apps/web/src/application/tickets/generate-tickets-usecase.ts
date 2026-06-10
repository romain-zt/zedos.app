import { Result, err, ok } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';
import type { TicketDTO } from '@repo/contracts/tickets';
import type {
  IAgentActivityRepository,
} from '@domain/team/team-repository';
import type {
  ITicketRepository,
  ITicketSeedSourceReader,
  TicketSeedSource,
} from '@domain/tickets/ticket-repository';
import type { IProjectRepository } from '@domain/project/project-repository';
import { RecordAgentActivityUseCase } from '@application/team/record-agent-activity-usecase';

export interface GenerateTicketsResult {
  created: TicketDTO[];
  skipped: number;
}

/**
 * Milo (engineering manager) seeds the ticket board from the delivery plan:
 *   1. Verify project ownership
 *   2. Prefer task-split tasks (1 task → 1 ticket, with story context);
 *      fall back to user-story lines when no task split exists
 *   3. Idempotent: sources already linked to a ticket are skipped
 *   4. Records agent activity around the run
 */
export class GenerateTicketsUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private ticketRepository: ITicketRepository,
    private sourceReader: ITicketSeedSourceReader,
    private activityRepository: IAgentActivityRepository,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
  }): Promise<Result<GenerateTicketsResult, ApplicationError>> {
    const projectResult = await this.projectRepository.findByIdAndUserId(
      input.projectId,
      input.userId,
    );
    if (projectResult.isErr()) return err(projectResult.error);

    const sourcesResult = await this.loadSources(input.projectId);
    if (sourcesResult.isErr()) return err(sourcesResult.error);
    const sources = sourcesResult.unwrap();

    if (sources.length === 0) {
      return err(
        new ValidationError(
          'Nothing to turn into tickets yet — generate user stories or a task split first',
        ),
      );
    }

    const activity = new RecordAgentActivityUseCase(this.activityRepository);
    const activityId = await activity.startSafe({
      projectId: input.projectId,
      kind: 'tickets_generation',
      summary: `Milo is turning the plan into tickets (${sources.length} candidates)`,
    });

    const seeded = await this.ticketRepository.createFromSources(input.projectId, sources);
    if (seeded.isErr()) {
      await activity.finishSafe(activityId, 'failed', 'Ticket creation failed');
      return err(seeded.error);
    }

    const { created, skipped } = seeded.unwrap();
    await activity.finishSafe(
      activityId,
      'completed',
      `Milo created ${created.length} ticket${created.length === 1 ? '' : 's'}${
        skipped > 0 ? ` (${skipped} already existed)` : ''
      }`,
    );
    return ok({ created, skipped });
  }

  private async loadSources(
    projectId: string,
  ): Promise<Result<TicketSeedSource[], ApplicationError>> {
    const taskSources = await this.sourceReader.readTaskSplitSources(projectId);
    if (taskSources.isErr()) return err(taskSources.error);
    if (taskSources.unwrap().length > 0) return ok(taskSources.unwrap());

    const storySources = await this.sourceReader.readUserStorySources(projectId);
    if (storySources.isErr()) return err(storySources.error);
    return ok(storySources.unwrap());
  }
}
