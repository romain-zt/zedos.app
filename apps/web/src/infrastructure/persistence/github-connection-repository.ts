import {
  db,
  githubConnections,
  eq,
  and,
  type NewGithubConnectionRow,
  type GithubConnectionUpdate,
} from '@repo/db';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { Result, err, ok } from '@repo/result';
import { ApplicationError, DatabaseError, NotFoundError } from '@shared/errors/application-error';
import type {
  GithubConnection,
  GithubConnectionDraft,
  GithubConnectionStatus,
  IGithubConnectionRepository,
} from '@domain/github';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'GithubConnectionRepository' });

type Row = typeof githubConnections.$inferSelect;

function toStatus(raw: string): GithubConnectionStatus {
  if (raw === 'active' || raw === 'disconnected' || raw === 'token_invalid') {
    return raw;
  }
  return 'disconnected';
}

function mapRow(row: Row): GithubConnection {
  return {
    id: row.id,
    projectId: row.projectId,
    connectedByUserId: row.connectedByUserId,
    ownerLogin: row.ownerLogin,
    repoName: row.repoName,
    installationId: row.installationId,
    status: toStatus(row.status),
    createdAt: row.createdAt,
    disconnectedAt: row.disconnectedAt,
  };
}

export class DrizzleGithubConnectionRepository implements IGithubConnectionRepository {
  async findByProjectId(
    projectId: string,
  ): Promise<Result<GithubConnection | null, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(githubConnections)
        .where(eq(githubConnections.projectId, projectId))
        .limit(1);
      return ok(row ? mapRow(row) : null);
    } catch (error) {
      logger.error('Failed to find github connection by project', error);
      return err(new DatabaseError('Failed to query GitHub connection'));
    }
  }

  async findByOwnerRepo(
    ownerLogin: string,
    repoName: string,
  ): Promise<Result<GithubConnection | null, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(githubConnections)
        .where(
          and(
            eq(githubConnections.ownerLogin, ownerLogin),
            eq(githubConnections.repoName, repoName),
            eq(githubConnections.status, 'active'),
          ),
        )
        .limit(1);
      return ok(row ? mapRow(row) : null);
    } catch (error) {
      logger.error('Failed to find github connection by owner/repo', error);
      return err(new DatabaseError('Failed to query GitHub connection'));
    }
  }

  async upsertActive(
    draft: GithubConnectionDraft,
  ): Promise<Result<GithubConnection, ApplicationError>> {
    try {
      const [existing] = await db
        .select()
        .from(githubConnections)
        .where(eq(githubConnections.projectId, draft.projectId))
        .limit(1);

      if (existing) {
        const update = {
          status: 'active',
          installationId: draft.installationId,
          disconnectedAt: null,
        } satisfies GithubConnectionUpdate;
        const [updated] = await db
          .update(githubConnections)
          .set(update as PgUpdateSetSource<typeof githubConnections>)
          .where(eq(githubConnections.id, existing.id))
          .returning();
        return ok(mapRow(updated));
      }

      const insert: NewGithubConnectionRow = {
        projectId: draft.projectId,
        connectedByUserId: draft.connectedByUserId,
        ownerLogin: draft.ownerLogin,
        repoName: draft.repoName,
        installationId: draft.installationId,
        status: 'active',
      };
      const [inserted] = await db.insert(githubConnections).values(insert).returning();
      return ok(mapRow(inserted));
    } catch (error) {
      logger.error('Failed to upsert github connection', error);
      return err(new DatabaseError('Failed to upsert GitHub connection'));
    }
  }

  async disconnect(projectId: string): Promise<Result<void, ApplicationError>> {
    try {
      const update = {
        status: 'disconnected',
        disconnectedAt: new Date(),
      } satisfies GithubConnectionUpdate;
      const result = await db
        .update(githubConnections)
        .set(update as PgUpdateSetSource<typeof githubConnections>)
        .where(eq(githubConnections.projectId, projectId))
        .returning({ id: githubConnections.id });
      if (result.length === 0) {
        return err(new NotFoundError('GitHub connection not found'));
      }
      return ok(undefined);
    } catch (error) {
      logger.error('Failed to disconnect github connection', error);
      return err(new DatabaseError('Failed to disconnect GitHub connection'));
    }
  }
}

export const githubConnectionRepository = new DrizzleGithubConnectionRepository();
