import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import type {
  ITicketSeedSourceReader,
  TicketSeedSource,
} from '@domain/tickets/ticket-repository';
import { inferAssigneeRole } from '@domain/tickets/infer-assignee-role';
import {
  db,
  taskSplitBundles,
  taskSplitTasks,
  userStoryCorpora,
  userStoryLines,
  eq,
  and,
  asc,
  isNull,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'TicketSeedSourceReader' });

export class DrizzleTicketSeedSourceReader implements ITicketSeedSourceReader {
  async readTaskSplitSources(
    projectId: string,
  ): Promise<Result<TicketSeedSource[], ApplicationError>> {
    try {
      const rows = await db
        .select({
          taskId: taskSplitTasks.id,
          title: taskSplitTasks.title,
          promptBody: taskSplitTasks.promptBody,
          storyTitle: taskSplitBundles.storyTitle,
          userStoryLineId: taskSplitBundles.userStoryLineId,
        })
        .from(taskSplitTasks)
        .innerJoin(taskSplitBundles, eq(taskSplitTasks.bundleId, taskSplitBundles.id))
        .where(and(eq(taskSplitBundles.projectId, projectId), isNull(taskSplitTasks.deletedAt)))
        .orderBy(asc(taskSplitTasks.sortOrder));

      return ok(
        rows.map((row): TicketSeedSource => {
          const storyContext = row.storyTitle ? `Story: ${row.storyTitle}\n\n` : '';
          return {
            title: row.title,
            description: `${storyContext}${row.promptBody}`,
            assigneeRole: inferAssigneeRole(row.title, row.promptBody),
            userStoryLineId: row.userStoryLineId,
            taskSplitTaskId: row.taskId,
          };
        }),
      );
    } catch (error) {
      logger.error('Failed to read task-split ticket sources', error);
      return err(new DatabaseError('Failed to read task-split sources'));
    }
  }

  async readUserStorySources(
    projectId: string,
  ): Promise<Result<TicketSeedSource[], ApplicationError>> {
    try {
      const rows = await db
        .select({
          lineId: userStoryLines.id,
          title: userStoryLines.title,
          body: userStoryLines.body,
        })
        .from(userStoryLines)
        .innerJoin(userStoryCorpora, eq(userStoryLines.corpusId, userStoryCorpora.id))
        .where(and(eq(userStoryCorpora.projectId, projectId), isNull(userStoryLines.archivedAt)))
        .orderBy(asc(userStoryLines.sortOrder));

      return ok(
        rows.map((row): TicketSeedSource => ({
          title: row.title,
          description: row.body,
          assigneeRole: inferAssigneeRole(row.title, row.body),
          userStoryLineId: row.lineId,
          taskSplitTaskId: null,
        })),
      );
    } catch (error) {
      logger.error('Failed to read user-story ticket sources', error);
      return err(new DatabaseError('Failed to read user-story sources'));
    }
  }
}

export const ticketSeedSourceReader = new DrizzleTicketSeedSourceReader();
