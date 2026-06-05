import {
  db,
  linearConnections,
  eq,
  type NewLinearConnectionRow,
  type LinearConnectionUpdate,
} from '@repo/db';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { Result, err, ok } from '@repo/result';
import { ApplicationError, DatabaseError, NotFoundError } from '@shared/errors/application-error';
import type {
  ILinearConnectionRepository,
  LinearConnection,
  LinearConnectionDraft,
  LinearConnectionStatus,
} from '@domain/linear';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'LinearConnectionRepository' });

type Row = typeof linearConnections.$inferSelect;

function toStatus(raw: string): LinearConnectionStatus {
  if (raw === 'active' || raw === 'disconnected' || raw === 'token_invalid') return raw;
  return 'disconnected';
}

function mapRow(row: Row): LinearConnection {
  return {
    id: row.id,
    projectId: row.projectId,
    connectedByUserId: row.connectedByUserId,
    teamId: row.teamId,
    linearProjectId: row.linearProjectId,
    status: toStatus(row.status),
    createdAt: row.createdAt,
    disconnectedAt: row.disconnectedAt,
  };
}

export class DrizzleLinearConnectionRepository implements ILinearConnectionRepository {
  async findByProjectId(
    projectId: string,
  ): Promise<Result<LinearConnection | null, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(linearConnections)
        .where(eq(linearConnections.projectId, projectId))
        .limit(1);
      return ok(row ? mapRow(row) : null);
    } catch (error) {
      logger.error('Failed to find linear connection by project', error);
      return err(new DatabaseError('Failed to query Linear connection'));
    }
  }

  async upsertActive(
    draft: LinearConnectionDraft,
  ): Promise<Result<LinearConnection, ApplicationError>> {
    try {
      const [existing] = await db
        .select()
        .from(linearConnections)
        .where(eq(linearConnections.projectId, draft.projectId))
        .limit(1);

      if (existing) {
        const update = {
          status: 'active',
          linearProjectId: draft.linearProjectId,
          disconnectedAt: null,
        } satisfies LinearConnectionUpdate;
        const [updated] = await db
          .update(linearConnections)
          .set(update as PgUpdateSetSource<typeof linearConnections>)
          .where(eq(linearConnections.id, existing.id))
          .returning();
        return ok(mapRow(updated));
      }

      const insert: NewLinearConnectionRow = {
        projectId: draft.projectId,
        connectedByUserId: draft.connectedByUserId,
        teamId: draft.teamId,
        linearProjectId: draft.linearProjectId,
        status: 'active',
      };
      const [inserted] = await db.insert(linearConnections).values(insert).returning();
      return ok(mapRow(inserted));
    } catch (error) {
      logger.error('Failed to upsert linear connection', error);
      return err(new DatabaseError('Failed to upsert Linear connection'));
    }
  }

  async disconnect(projectId: string): Promise<Result<void, ApplicationError>> {
    try {
      const update = {
        status: 'disconnected',
        disconnectedAt: new Date(),
      } satisfies LinearConnectionUpdate;
      const result = await db
        .update(linearConnections)
        .set(update as PgUpdateSetSource<typeof linearConnections>)
        .where(eq(linearConnections.projectId, projectId))
        .returning({ id: linearConnections.id });
      if (result.length === 0) {
        return err(new NotFoundError('Linear connection not found'));
      }
      return ok(undefined);
    } catch (error) {
      logger.error('Failed to disconnect linear connection', error);
      return err(new DatabaseError('Failed to disconnect Linear connection'));
    }
  }
}

export const linearConnectionRepository = new DrizzleLinearConnectionRepository();
