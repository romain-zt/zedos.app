/**
 * Drizzle adapter — reads locked task_split_* bundles (task-split plan DDL).
 * Returns an empty list when tables are not yet migrated (Postgres 42P01).
 */

import { IDeliveryExportRepository } from '@domain/delivery/delivery-export-repository';
import type { ExportEligibleBundle, ExportTask } from '@domain/delivery/export-bundle';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import { db, sql } from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'DeliveryExportRepository' });

type PgErrorShape = { code?: string };

function isMissingTaskSplitTables(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as PgErrorShape).code === '42P01';
  }
  return false;
}

type BundleRow = {
  id: string;
  project_id: string;
  story_title: string | null;
  story_body: string | null;
  locked_at: Date;
  task_count: number;
};

type TaskRow = {
  id: string;
  bundle_id: string;
  sort_order: number;
  title: string;
  prompt_body: string;
};

function mapBundleSummary(row: BundleRow, tasks: ExportTask[]): ExportEligibleBundle {
  return {
    id: row.id,
    projectId: row.project_id,
    storyTitle: row.story_title ?? 'Untitled story',
    storyBody: row.story_body ?? '',
    lockedAt: row.locked_at,
    taskCount: row.task_count,
    tasks,
  };
}

function groupTasksByBundle(taskRows: TaskRow[]): Map<string, ExportTask[]> {
  const map = new Map<string, ExportTask[]>();
  for (const row of taskRows) {
    const list = map.get(row.bundle_id) ?? [];
    list.push({
      id: row.id,
      sortOrder: row.sort_order,
      title: row.title,
      promptBody: row.prompt_body,
    });
    map.set(row.bundle_id, list);
  }
  for (const tasks of map.values()) {
    tasks.sort((a, b) => a.sortOrder - b.sortOrder);
  }
  return map;
}

export class DrizzleDeliveryExportRepository implements IDeliveryExportRepository {
  async listLockedBundlesByProject(
    projectId: string
  ): Promise<Result<ExportEligibleBundle[], ApplicationError>> {
    try {
      const bundleResult = await db.execute(sql`
        SELECT
          b.id,
          b.project_id,
          b.story_title,
          b.story_body,
          b.locked_at,
          (
            SELECT COUNT(*)::int
            FROM task_split_tasks t
            WHERE t.bundle_id = b.id
              AND t.deleted_at IS NULL
          ) AS task_count
        FROM task_split_bundles b
        WHERE b.project_id = ${projectId}
          AND b.locked_at IS NOT NULL
        ORDER BY b.locked_at DESC
      `);

      const rows = bundleResult as unknown as BundleRow[];
      return ok(
        rows.map((row) =>
          mapBundleSummary(row, [])
        )
      );
    } catch (e) {
      if (isMissingTaskSplitTables(e)) {
        logger.info('task_split tables not present; returning empty eligible list', { projectId });
        return ok([]);
      }
      logger.error('Failed to list export-eligible bundles', { projectId, error: e });
      return err(new DatabaseError('Failed to list export-eligible bundles'));
    }
  }

  async findLockedBundlesByIds(
    projectId: string,
    bundleIds: string[]
  ): Promise<Result<ExportEligibleBundle[], ApplicationError>> {
    if (bundleIds.length === 0) return ok([]);

    try {
      const bundleResult = await db.execute(sql`
        SELECT
          b.id,
          b.project_id,
          b.story_title,
          b.story_body,
          b.locked_at,
          (
            SELECT COUNT(*)::int
            FROM task_split_tasks t
            WHERE t.bundle_id = b.id
              AND t.deleted_at IS NULL
          ) AS task_count
        FROM task_split_bundles b
        WHERE b.project_id = ${projectId}
          AND b.locked_at IS NOT NULL
          AND b.id IN (${sql.join(
            bundleIds.map((id) => sql`${id}`),
            sql`, `
          )})
        ORDER BY b.locked_at ASC
      `);

      const bundleRows = bundleResult as unknown as BundleRow[];
      if (bundleRows.length === 0) return ok([]);

      const ids = bundleRows.map((r) => r.id);
      const taskResult = await db.execute(sql`
        SELECT
          t.id,
          t.bundle_id,
          t.sort_order,
          t.title,
          t.prompt_body
        FROM task_split_tasks t
        WHERE t.bundle_id IN (${sql.join(
          ids.map((id) => sql`${id}`),
          sql`, `
        )})
          AND t.deleted_at IS NULL
        ORDER BY t.bundle_id, t.sort_order ASC
      `);

      const tasksByBundle = groupTasksByBundle(taskResult as unknown as TaskRow[]);
      return ok(
        bundleRows.map((row) => mapBundleSummary(row, tasksByBundle.get(row.id) ?? []))
      );
    } catch (e) {
      if (isMissingTaskSplitTables(e)) {
        logger.info('task_split tables not present; returning no bundles for ids', { projectId });
        return ok([]);
      }
      logger.error('Failed to load bundles for export', { projectId, error: e });
      return err(new DatabaseError('Failed to load bundles for export'));
    }
  }
}
