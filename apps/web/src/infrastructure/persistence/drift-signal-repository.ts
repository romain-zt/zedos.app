import {
  db,
  driftSignals,
  eq,
  and,
  desc,
  type NewDriftSignalRow,
  type DriftSignalUpdate,
} from '@repo/db';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { Result, err, ok } from '@repo/result';
import {
  ApplicationError,
  DatabaseError,
  NotFoundError,
} from '@shared/errors/application-error';
import type {
  DriftSignal,
  DriftSignalDraft,
  DriftSignalKind,
  DriftSignalSeverity,
  DriftSignalSource,
  DriftSignalStatus,
  IDriftSignalRepository,
} from '@domain/github';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'DriftSignalRepository' });

type Row = typeof driftSignals.$inferSelect;

function toKind(raw: string): DriftSignalKind {
  if (raw === 'DRIFT-01' || raw === 'DRIFT-02' || raw === 'DRIFT-03' || raw === 'DRIFT-04') {
    return raw;
  }
  return 'DRIFT-04';
}

function toSeverity(raw: string): DriftSignalSeverity {
  if (raw === 'info' || raw === 'warn' || raw === 'critical') return raw;
  return 'info';
}

function toSource(raw: string): DriftSignalSource {
  if (raw === 'webhook' || raw === 'scheduled' || raw === 'backfill') return raw;
  return 'webhook';
}

function toStatus(raw: string): DriftSignalStatus {
  if (raw === 'open' || raw === 'resolved' || raw === 'dismissed') return raw;
  return 'open';
}

function mapRow(row: Row): DriftSignal {
  const payload = row.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : {};
  return {
    id: row.id,
    projectId: row.projectId,
    kind: toKind(row.kind),
    severity: toSeverity(row.severity),
    summary: row.summary,
    payload,
    source: toSource(row.source),
    externalDeliveryId: row.externalDeliveryId,
    status: toStatus(row.status),
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt,
    dismissedAt: row.dismissedAt,
  };
}

export class DrizzleDriftSignalRepository implements IDriftSignalRepository {
  async insertIfAbsent(
    draft: DriftSignalDraft,
  ): Promise<Result<{ created: boolean; signal: DriftSignal | null }, ApplicationError>> {
    try {
      const insert: NewDriftSignalRow = {
        projectId: draft.projectId,
        kind: draft.kind,
        severity: draft.severity,
        summary: draft.summary,
        payload: draft.payload,
        source: draft.source,
        externalDeliveryId: draft.externalDeliveryId,
        status: 'open',
      };
      const [inserted] = await db
        .insert(driftSignals)
        .values(insert)
        .onConflictDoNothing({
          target: [driftSignals.projectId, driftSignals.externalDeliveryId],
        })
        .returning();
      if (!inserted) {
        return ok({ created: false, signal: null });
      }
      return ok({ created: true, signal: mapRow(inserted) });
    } catch (error) {
      logger.error('Failed to insert drift signal', error);
      return err(new DatabaseError('Failed to persist drift signal'));
    }
  }

  async findByProjectId(
    projectId: string,
    statusFilter?: DriftSignalStatus,
  ): Promise<Result<DriftSignal[], ApplicationError>> {
    try {
      const where = statusFilter
        ? and(eq(driftSignals.projectId, projectId), eq(driftSignals.status, statusFilter))
        : eq(driftSignals.projectId, projectId);
      const rows = await db
        .select()
        .from(driftSignals)
        .where(where)
        .orderBy(desc(driftSignals.createdAt))
        .limit(500);
      return ok(rows.map(mapRow));
    } catch (error) {
      logger.error('Failed to list drift signals', error);
      return err(new DatabaseError('Failed to list drift signals'));
    }
  }

  async findByIdForProject(
    projectId: string,
    signalId: string,
  ): Promise<Result<DriftSignal | null, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(driftSignals)
        .where(and(eq(driftSignals.projectId, projectId), eq(driftSignals.id, signalId)))
        .limit(1);
      return ok(row ? mapRow(row) : null);
    } catch (error) {
      logger.error('Failed to find drift signal', error);
      return err(new DatabaseError('Failed to find drift signal'));
    }
  }

  async updateStatus(
    projectId: string,
    signalId: string,
    status: DriftSignalStatus,
  ): Promise<Result<DriftSignal, ApplicationError>> {
    try {
      const now = new Date();
      const update = {
        status,
        resolvedAt: status === 'resolved' ? now : null,
        dismissedAt: status === 'dismissed' ? now : null,
      } satisfies DriftSignalUpdate;
      const [updated] = await db
        .update(driftSignals)
        .set(update as PgUpdateSetSource<typeof driftSignals>)
        .where(and(eq(driftSignals.projectId, projectId), eq(driftSignals.id, signalId)))
        .returning();
      if (!updated) {
        return err(new NotFoundError('Drift signal not found'));
      }
      return ok(mapRow(updated));
    } catch (error) {
      logger.error('Failed to update drift signal status', error);
      return err(new DatabaseError('Failed to update drift signal status'));
    }
  }
}

export const driftSignalRepository = new DrizzleDriftSignalRepository();
