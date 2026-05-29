/**
 * Drizzle v0.38: nullable columns (text, timestamp without notNull) are omitted
 * from .set() and .values() types. Use db.execute(sql`...`) for those fields,
 * matching the existing markReviewReady pattern in user-story-corpus-repository.
 */
import { randomUUID } from 'node:crypto';
import type { ITaskSplitBundleRepository } from '@domain/task-split/task-split-bundle-repository';
import type {
  SaveTaskInput,
  TaskSplitBundleDomain,
  TaskSplitTaskDomain,
} from '@domain/task-split/task-split-bundle';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError, NotFoundError } from '@shared/errors/application-error';
import { db, taskSplitBundles, taskSplitTasks, eq, asc, sql } from '@repo/db';
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
    sourceUserStoryKey: bundleRow.sourceUserStoryKey,
    storyTitleSnapshot: bundleRow.storyTitleSnapshot,
    lockedAt: bundleRow.lockedAt,
    createdAt: bundleRow.createdAt,
    updatedAt: bundleRow.updatedAt,
    tasks: taskRows.map(mapTask),
  };
}

export class DrizzleTaskSplitBundleRepository implements ITaskSplitBundleRepository {
  async findByProject(
    projectId: string
  ): Promise<Result<TaskSplitBundleDomain | null, ApplicationError>> {
    try {
      const [bundleRow] = await db
        .select()
        .from(taskSplitBundles)
        .where(eq(taskSplitBundles.projectId, projectId));

      if (!bundleRow) return ok(null);

      const taskRows = await db
        .select()
        .from(taskSplitTasks)
        .where(eq(taskSplitTasks.bundleId, bundleRow.id))
        .orderBy(asc(taskSplitTasks.sortOrder));

      return ok(mapBundle(bundleRow, taskRows));
    } catch (error) {
      logger.error('Failed to load task split bundle', error);
      return err(new DatabaseError('Failed to load task split bundle'));
    }
  }

  async save(
    projectId: string,
    tasks: SaveTaskInput[],
    meta: { sourceUserStoryKey?: string | null; storyTitleSnapshot?: string | null }
  ): Promise<Result<TaskSplitBundleDomain, ApplicationError>> {
    try {
      const saved = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(taskSplitBundles)
          .where(eq(taskSplitBundles.projectId, projectId));

        const now = new Date();
        const nowIso = now.toISOString();
        let bundleId: string;

        if (existing) {
          bundleId = existing.id;
          await tx.delete(taskSplitTasks).where(eq(taskSplitTasks.bundleId, bundleId));
          const nextKey = meta.sourceUserStoryKey ?? existing.sourceUserStoryKey;
          const nextTitle = meta.storyTitleSnapshot ?? existing.storyTitleSnapshot;
          // Nullable columns omitted from .set() in Drizzle v0.38 — use raw SQL.
          await tx.execute(
            sql`UPDATE task_split_bundles SET updated_at = ${nowIso}, source_user_story_key = ${nextKey}, story_title_snapshot = ${nextTitle} WHERE id = ${bundleId}`
          );
        } else {
          const newId = randomUUID();
          const key = meta.sourceUserStoryKey ?? null;
          const title = meta.storyTitleSnapshot ?? null;
          // Nullable columns omitted from .values() in Drizzle v0.38 — use raw SQL.
          await tx.execute(
            sql`INSERT INTO task_split_bundles (id, project_id, source_user_story_key, story_title_snapshot, updated_at) VALUES (${newId}, ${projectId}, ${key}, ${title}, ${nowIso})`
          );
          bundleId = newId;
        }

        if (tasks.length > 0) {
          await tx.insert(taskSplitTasks).values(
            tasks.map((t, i) => ({
              id: t.id ?? randomUUID(),
              bundleId,
              sortOrder: t.sortOrder ?? i,
              title: t.title,
              promptBody: t.promptBody,
              manual: t.manual ?? false,
              updatedAt: now,
            }))
          );
        }

        const [bundleRow] = await tx
          .select()
          .from(taskSplitBundles)
          .where(eq(taskSplitBundles.id, bundleId));

        if (!bundleRow) return null;

        const taskRows = await tx
          .select()
          .from(taskSplitTasks)
          .where(eq(taskSplitTasks.bundleId, bundleId))
          .orderBy(asc(taskSplitTasks.sortOrder));

        return mapBundle(bundleRow, taskRows);
      });

      if (saved === null) {
        return err(new DatabaseError('Bundle row missing after save'));
      }

      return ok(saved);
    } catch (error) {
      logger.error('Failed to save task split bundle', error);
      return err(new DatabaseError('Failed to save task split bundle'));
    }
  }

  async unlock(projectId: string): Promise<Result<TaskSplitBundleDomain, ApplicationError>> {
    try {
      const [bundleRow] = await db
        .select()
        .from(taskSplitBundles)
        .where(eq(taskSplitBundles.projectId, projectId));

      if (!bundleRow) {
        return err(new NotFoundError('Task split bundle not found'));
      }

      const now = new Date();
      const nowIso = now.toISOString();
      await db.execute(
        sql`UPDATE task_split_bundles SET locked_at = NULL, updated_at = ${nowIso} WHERE id = ${bundleRow.id}`
      );

      const [updated] = await db
        .select()
        .from(taskSplitBundles)
        .where(eq(taskSplitBundles.id, bundleRow.id));

      if (!updated) return err(new DatabaseError('Bundle row missing after unlock'));

      const taskRows = await db
        .select()
        .from(taskSplitTasks)
        .where(eq(taskSplitTasks.bundleId, bundleRow.id))
        .orderBy(asc(taskSplitTasks.sortOrder));

      return ok(mapBundle(updated, taskRows));
    } catch (error) {
      logger.error('Failed to unlock task split bundle', error);
      return err(new DatabaseError('Failed to unlock task split bundle'));
    }
  }

  async lock(projectId: string): Promise<Result<TaskSplitBundleDomain, ApplicationError>> {
    try {
      const [bundleRow] = await db
        .select()
        .from(taskSplitBundles)
        .where(eq(taskSplitBundles.projectId, projectId));

      if (!bundleRow) {
        return err(new NotFoundError('Task split bundle not found'));
      }

      const now = new Date();
      const nowIso = now.toISOString();
      // Nullable locked_at omitted from .set() in Drizzle v0.38 — use raw SQL.
      await db.execute(
        sql`UPDATE task_split_bundles SET locked_at = ${nowIso}, updated_at = ${nowIso} WHERE id = ${bundleRow.id}`
      );

      const [updated] = await db
        .select()
        .from(taskSplitBundles)
        .where(eq(taskSplitBundles.id, bundleRow.id));

      if (!updated) return err(new DatabaseError('Bundle row missing after lock'));

      const taskRows = await db
        .select()
        .from(taskSplitTasks)
        .where(eq(taskSplitTasks.bundleId, bundleRow.id))
        .orderBy(asc(taskSplitTasks.sortOrder));

      return ok(mapBundle(updated, taskRows));
    } catch (error) {
      logger.error('Failed to lock task split bundle', error);
      return err(new DatabaseError('Failed to lock task split bundle'));
    }
  }
}
