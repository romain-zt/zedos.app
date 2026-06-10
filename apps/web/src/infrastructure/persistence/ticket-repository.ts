import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  DatabaseError,
  NotFoundError,
} from '@shared/errors/application-error';
import {
  TicketDTOSchema,
  type CreateTicketRequest,
  type TicketDTO,
  type UpdateTicketRequest,
} from '@repo/contracts/tickets';
import type { ITicketRepository, TicketSeedSource } from '@domain/tickets/ticket-repository';
import {
  db,
  tickets,
  eq,
  and,
  asc,
  sql,
  type NewTicketRow,
  type TicketUpdate,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'TicketRepository' });

export function ticketKey(number: number): string {
  return `ZED-${number}`;
}

function mapRow(row: typeof tickets.$inferSelect): TicketDTO | null {
  const parsed = TicketDTOSchema.safeParse({
    id: row.id,
    projectId: row.projectId,
    number: row.number,
    key: ticketKey(row.number),
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    estimate: row.estimate,
    assigneeRole: row.assigneeRole,
    userStoryLineId: row.userStoryLineId,
    taskSplitTaskId: row.taskSplitTaskId,
    milestoneId: row.milestoneId,
    dueDate: row.dueDate,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
  if (!parsed.success) {
    logger.error('Ticket row failed DTO validation', { ticketId: row.id });
    return null;
  }
  return parsed.data;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function nextTicketNumber(tx: Tx, projectId: string): Promise<number> {
  const [row] = await tx
    .select({ max: sql<number>`coalesce(max(${tickets.number}), 0)::int` })
    .from(tickets)
    .where(eq(tickets.projectId, projectId));
  return (row?.max ?? 0) + 1;
}

export class DrizzleTicketRepository implements ITicketRepository {
  async listByProject(projectId: string): Promise<Result<TicketDTO[], ApplicationError>> {
    try {
      const rows = await db
        .select()
        .from(tickets)
        .where(eq(tickets.projectId, projectId))
        .orderBy(asc(tickets.sortOrder), asc(tickets.number));
      const dtos: TicketDTO[] = [];
      for (const row of rows) {
        const dto = mapRow(row);
        if (dto) dtos.push(dto);
      }
      return ok(dtos);
    } catch (error) {
      logger.error('Failed to list tickets', error);
      return err(new DatabaseError('Failed to list tickets'));
    }
  }

  async findById(ticketId: string): Promise<Result<TicketDTO | null, ApplicationError>> {
    try {
      const [row] = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
      if (!row) return ok(null);
      return ok(mapRow(row));
    } catch (error) {
      logger.error('Failed to load ticket', error);
      return err(new DatabaseError('Failed to load ticket'));
    }
  }

  async create(
    projectId: string,
    input: CreateTicketRequest,
  ): Promise<Result<TicketDTO, ApplicationError>> {
    try {
      const created = await db.transaction(async (tx) => {
        const number = await nextTicketNumber(tx, projectId);
        const insertRow: NewTicketRow = {
          projectId,
          number,
          title: input.title,
          description: input.description ?? '',
          status: input.status ?? 'backlog',
          priority: input.priority ?? 'medium',
          estimate: input.estimate ?? null,
          assigneeRole: input.assigneeRole ?? null,
          milestoneId: input.milestoneId ?? null,
          dueDate: input.dueDate ?? null,
          sortOrder: number,
          updatedAt: new Date(),
        };
        const [row] = await tx.insert(tickets).values(insertRow).returning();
        return row ?? null;
      });
      const dto = created ? mapRow(created) : null;
      if (!dto) return err(new DatabaseError('Failed to create ticket'));
      return ok(dto);
    } catch (error) {
      logger.error('Failed to create ticket', error);
      return err(new DatabaseError('Failed to create ticket'));
    }
  }

  async createFromSources(
    projectId: string,
    sources: TicketSeedSource[],
  ): Promise<Result<{ created: TicketDTO[]; skipped: number }, ApplicationError>> {
    try {
      const result = await db.transaction(async (tx) => {
        const existing = await tx
          .select({
            taskSplitTaskId: tickets.taskSplitTaskId,
            userStoryLineId: tickets.userStoryLineId,
          })
          .from(tickets)
          .where(eq(tickets.projectId, projectId));
        const linkedTasks = new Set(
          existing.map((r) => r.taskSplitTaskId).filter((v): v is string => v !== null),
        );
        const linkedStories = new Set(
          existing.map((r) => r.userStoryLineId).filter((v): v is string => v !== null),
        );

        let number = await nextTicketNumber(tx, projectId);
        const createdRows: (typeof tickets.$inferSelect)[] = [];
        let skipped = 0;

        for (const source of sources) {
          const alreadyLinked =
            (source.taskSplitTaskId !== null && linkedTasks.has(source.taskSplitTaskId)) ||
            (source.taskSplitTaskId === null &&
              source.userStoryLineId !== null &&
              linkedStories.has(source.userStoryLineId));
          if (alreadyLinked) {
            skipped += 1;
            continue;
          }

          const insertRow: NewTicketRow = {
            projectId,
            number,
            title: source.title,
            description: source.description,
            status: 'todo',
            priority: 'medium',
            assigneeRole: source.assigneeRole,
            userStoryLineId: source.userStoryLineId,
            taskSplitTaskId: source.taskSplitTaskId,
            sortOrder: number,
            updatedAt: new Date(),
          };
          const [row] = await tx.insert(tickets).values(insertRow).returning();
          if (row) {
            createdRows.push(row);
            number += 1;
          }
        }

        return { createdRows, skipped };
      });

      const created: TicketDTO[] = [];
      for (const row of result.createdRows) {
        const dto = mapRow(row);
        if (dto) created.push(dto);
      }
      return ok({ created, skipped: result.skipped });
    } catch (error) {
      logger.error('Failed to seed tickets from sources', error);
      return err(new DatabaseError('Failed to create tickets'));
    }
  }

  async update(
    ticketId: string,
    projectId: string,
    patch: UpdateTicketRequest,
  ): Promise<Result<TicketDTO, ApplicationError>> {
    try {
      const update: TicketUpdate = { ...patch, updatedAt: new Date() };
      const [row] = await db
        .update(tickets)
        .set(update)
        .where(and(eq(tickets.id, ticketId), eq(tickets.projectId, projectId)))
        .returning();
      if (!row) return err(new NotFoundError('Ticket not found'));
      const dto = mapRow(row);
      if (!dto) return err(new DatabaseError('Failed to update ticket'));
      return ok(dto);
    } catch (error) {
      logger.error('Failed to update ticket', error);
      return err(new DatabaseError('Failed to update ticket'));
    }
  }

  async bulkAssign(
    projectId: string,
    assignments: Array<{ ticketId: string; milestoneId: string; dueDate: string | null }>,
  ): Promise<Result<void, ApplicationError>> {
    if (assignments.length === 0) return ok(undefined);
    try {
      await db.transaction(async (tx) => {
        for (const assignment of assignments) {
          const update: TicketUpdate = {
            milestoneId: assignment.milestoneId,
            dueDate: assignment.dueDate,
            updatedAt: new Date(),
          };
          await tx
            .update(tickets)
            .set(update)
            .where(and(eq(tickets.id, assignment.ticketId), eq(tickets.projectId, projectId)));
        }
      });
      return ok(undefined);
    } catch (error) {
      logger.error('Failed to assign tickets to milestones', error);
      return err(new DatabaseError('Failed to assign tickets to milestones'));
    }
  }

  async delete(ticketId: string, projectId: string): Promise<Result<void, ApplicationError>> {
    try {
      const deleted = await db
        .delete(tickets)
        .where(and(eq(tickets.id, ticketId), eq(tickets.projectId, projectId)))
        .returning({ id: tickets.id });
      if (deleted.length === 0) return err(new NotFoundError('Ticket not found'));
      return ok(undefined);
    } catch (error) {
      logger.error('Failed to delete ticket', error);
      return err(new DatabaseError('Failed to delete ticket'));
    }
  }
}

export const ticketRepository = new DrizzleTicketRepository();

