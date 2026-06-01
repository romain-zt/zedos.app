/**
 * Drizzle adapter for task-split bundles + tasks.
 */

import { randomUUID } from 'node:crypto';
import { ITaskSplitBundleRepository } from '@domain/task-split/task-split-bundle-repository';
import type {
  EligibleUserStoryLineSnapshot,
  SaveTaskSplitTaskInput,
  TaskSplitBundleDomain,
  TaskSplitTaskDomain,
} from '@domain/task-split/task-split-bundle';
import { Result, ok, err } from '@repo/result';
import {
  ApplicationError,
  DatabaseError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@shared/errors/application-error';
import {
  db,
  eq,
  and,
  asc,
  isNull,
  isNotNull,
  taskSplitBundles,
  taskSplitTasks,
  userStoryCorpora,
  userStoryLines,
  type NewTaskSplitBundleRow,
  type NewTaskSplitTaskRow,
  type TaskSplitBundleUpdate,
  type TaskSplitTaskUpdate,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'TaskSplitBundleRepository' });

function mapTask(row: typeof taskSplitTasks.$inferSelect): TaskSplitTaskDomain {
  return {
    id: row.id,
    bundleId: row.bundleId,
    sortOrder: row.sortOrder,
    title: row.title,
    promptBody: row.promptBody,
    manual: row.manual,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapBundle(
  bundleRow: typeof taskSplitBundles.$inferSelect,
  taskRows: typeof taskSplitTasks.$inferSelect[]
): TaskSplitBundleDomain {
  return {
    id: bundleRow.id,
    projectId: bundleRow.projectId,
    userStoryLineId: bundleRow.userStoryLineId,
    storyTitle: bundleRow.storyTitle,
    storyBody: bundleRow.storyBody,
    lockedAt: bundleRow.lockedAt,
    createdAt: bundleRow.createdAt,
    updatedAt: bundleRow.updatedAt,
    tasks: taskRows.map(mapTask),
  };
}

async function loadBundleWithTasks(
  bundleId: string
): Promise<TaskSplitBundleDomain | null> {
  const [bundleRow] = await db
    .select()
    .from(taskSplitBundles)
    .where(eq(taskSplitBundles.id, bundleId));

  if (!bundleRow) return null;

  const taskRows = await db
    .select()
    .from(taskSplitTasks)
    .where(and(eq(taskSplitTasks.bundleId, bundleId), isNull(taskSplitTasks.deletedAt)))
    .orderBy(asc(taskSplitTasks.sortOrder));

  return mapBundle(bundleRow, taskRows);
}

export class DrizzleTaskSplitBundleRepository implements ITaskSplitBundleRepository {
  async findEligibleStoryLine(
    projectId: string,
    userStoryLineId: string
  ): Promise<Result<EligibleUserStoryLineSnapshot | null, ApplicationError>> {
    try {
      const [row] = await db
        .select({
          lineId: userStoryLines.id,
          title: userStoryLines.title,
          body: userStoryLines.body,
        })
        .from(userStoryLines)
        .innerJoin(userStoryCorpora, eq(userStoryLines.corpusId, userStoryCorpora.id))
        .where(
          and(
            eq(userStoryCorpora.projectId, projectId),
            eq(userStoryLines.id, userStoryLineId),
            isNull(userStoryLines.archivedAt),
            isNotNull(userStoryCorpora.reviewReadyAt)
          )
        );

      if (!row) return ok(null);
      return ok({
        lineId: row.lineId,
        title: row.title,
        body: row.body,
      });
    } catch (error) {
      logger.error('Failed to resolve eligible user story line', error);
      return err(new DatabaseError('Failed to resolve eligible user story line'));
    }
  }

  async findByProjectAndStoryLine(
    projectId: string,
    userStoryLineId: string
  ): Promise<Result<TaskSplitBundleDomain | null, ApplicationError>> {
    try {
      const [bundleRow] = await db
        .select()
        .from(taskSplitBundles)
        .where(
          and(
            eq(taskSplitBundles.projectId, projectId),
            eq(taskSplitBundles.userStoryLineId, userStoryLineId)
          )
        );

      if (!bundleRow) return ok(null);

      const taskRows = await db
        .select()
        .from(taskSplitTasks)
        .where(and(eq(taskSplitTasks.bundleId, bundleRow.id), isNull(taskSplitTasks.deletedAt)))
        .orderBy(asc(taskSplitTasks.sortOrder));

      return ok(mapBundle(bundleRow, taskRows));
    } catch (error) {
      logger.error('Failed to load task-split bundle', error);
      return err(new DatabaseError('Failed to load task-split bundle'));
    }
  }

  async save(
    projectId: string,
    userStoryLineId: string,
    storyTitle: string,
    storyBody: string,
    tasks: SaveTaskSplitTaskInput[]
  ): Promise<Result<TaskSplitBundleDomain, ApplicationError>> {
    if (tasks.length < 1) {
      return err(new ValidationError('At least one task is required'));
    }

    try {
      const saved = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(taskSplitBundles)
          .where(
            and(
              eq(taskSplitBundles.projectId, projectId),
              eq(taskSplitBundles.userStoryLineId, userStoryLineId)
            )
          );

        const now = new Date();

        if (existing?.lockedAt) {
          throw new ForbiddenError('Bundle is locked and cannot be edited');
        }

        let bundleId: string;

        if (existing) {
          bundleId = existing.id;
          const bundlePatch: TaskSplitBundleUpdate = {
            storyTitle,
            storyBody,
            updatedAt: now,
          };
          await tx
            .update(taskSplitBundles)
            .set(bundlePatch)
            .where(eq(taskSplitBundles.id, bundleId));

          const softDeletePatch: TaskSplitTaskUpdate = { deletedAt: now, updatedAt: now };
          await tx
            .update(taskSplitTasks)
            .set(softDeletePatch)
            .where(
              and(eq(taskSplitTasks.bundleId, bundleId), isNull(taskSplitTasks.deletedAt))
            );
        } else {
          const insertRow: NewTaskSplitBundleRow = {
            projectId,
            userStoryLineId,
            storyTitle,
            storyBody,
            updatedAt: now,
          };
          const [inserted] = await tx
            .insert(taskSplitBundles)
            .values(insertRow)
            .returning({ id: taskSplitBundles.id });

          if (!inserted) {
            throw new DatabaseError('Insert task_split_bundles returned no row');
          }
          bundleId = inserted.id;
        }

        const taskRows: NewTaskSplitTaskRow[] = tasks.map((task, index) => ({
          id: task.id ?? randomUUID(),
          bundleId,
          sortOrder: task.sortOrder ?? index,
          title: task.title,
          promptBody: task.promptBody,
          manual: task.manual,
          updatedAt: now,
        }));
        await tx.insert(taskSplitTasks).values(taskRows);

        const [bundleRow] = await tx
          .select()
          .from(taskSplitBundles)
          .where(eq(taskSplitBundles.id, bundleId));

        if (!bundleRow) {
          throw new DatabaseError('Bundle row missing after save');
        }

        const loadedTasks = await tx
          .select()
          .from(taskSplitTasks)
          .where(and(eq(taskSplitTasks.bundleId, bundleId), isNull(taskSplitTasks.deletedAt)))
          .orderBy(asc(taskSplitTasks.sortOrder));

        return mapBundle(bundleRow, loadedTasks);
      });

      return ok(saved);
    } catch (error) {
      if (error instanceof ApplicationError) {
        return err(error);
      }
      logger.error('Failed to save task-split bundle', error);
      return err(new DatabaseError('Failed to save task-split bundle'));
    }
  }

  async lock(
    projectId: string,
    bundleId: string
  ): Promise<Result<TaskSplitBundleDomain, ApplicationError>> {
    try {
      const locked = await db.transaction(async (tx) => {
        const [bundleRow] = await tx
          .select()
          .from(taskSplitBundles)
          .where(and(eq(taskSplitBundles.id, bundleId), eq(taskSplitBundles.projectId, projectId)));

        if (!bundleRow) {
          throw new NotFoundError('Task-split bundle not found');
        }

        if (bundleRow.lockedAt) {
          throw new ValidationError('Bundle is already locked');
        }

        const activeTasks = await tx
          .select({ id: taskSplitTasks.id })
          .from(taskSplitTasks)
          .where(and(eq(taskSplitTasks.bundleId, bundleId), isNull(taskSplitTasks.deletedAt)));

        if (activeTasks.length === 0) {
          throw new ValidationError('Cannot lock a bundle with no tasks');
        }

        const now = new Date();
        const lockPatch: TaskSplitBundleUpdate = { lockedAt: now, updatedAt: now };
        await tx
          .update(taskSplitBundles)
          .set(lockPatch)
          .where(eq(taskSplitBundles.id, bundleId));

        const loaded = await loadBundleWithTasks(bundleId);
        if (!loaded) {
          throw new DatabaseError('Bundle missing after lock');
        }
        return loaded;
      });

      return ok(locked);
    } catch (error) {
      if (error instanceof ApplicationError) {
        return err(error);
      }
      logger.error('Failed to lock task-split bundle', error);
      return err(new DatabaseError('Failed to lock task-split bundle'));
    }
  }
}
