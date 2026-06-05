import {
  db,
  linearIssueLinks,
  userStoryLines,
  userStoryCorpora,
  eq,
  and,
  type NewLinearIssueLinkRow,
  type LinearIssueLinkUpdate,
} from '@repo/db';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { Result, err, ok } from '@repo/result';
import {
  ApplicationError,
  DatabaseError,
  NotFoundError,
} from '@shared/errors/application-error';
import type {
  ILinearIssueLinkRepository,
  LinearIssueLink,
  LinearIssueLinkDraft,
  LinearIssueLinkStatus,
  UserStoryLineForPush,
} from '@domain/linear';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'LinearIssueLinkRepository' });

type Row = typeof linearIssueLinks.$inferSelect;

function toStatus(raw: string): LinearIssueLinkStatus {
  if (
    raw === 'triage' ||
    raw === 'backlog' ||
    raw === 'todo' ||
    raw === 'in_progress' ||
    raw === 'done' ||
    raw === 'canceled' ||
    raw === 'unknown'
  ) {
    return raw;
  }
  return 'unknown';
}

function mapRow(row: Row): LinearIssueLink {
  return {
    id: row.id,
    projectId: row.projectId,
    userStoryLineId: row.userStoryLineId,
    linearIssueId: row.linearIssueId,
    linearIssueIdentifier: row.linearIssueIdentifier,
    status: toStatus(row.status),
    lastSyncedAt: row.lastSyncedAt,
    createdAt: row.createdAt,
  };
}

export class DrizzleLinearIssueLinkRepository implements ILinearIssueLinkRepository {
  async findUserStoryLineForProject(
    projectId: string,
    userStoryLineId: string,
  ): Promise<Result<UserStoryLineForPush | null, ApplicationError>> {
    try {
      const [row] = await db
        .select({
          id: userStoryLines.id,
          title: userStoryLines.title,
          body: userStoryLines.body,
          projectId: userStoryCorpora.projectId,
        })
        .from(userStoryLines)
        .innerJoin(userStoryCorpora, eq(userStoryCorpora.id, userStoryLines.corpusId))
        .where(
          and(eq(userStoryLines.id, userStoryLineId), eq(userStoryCorpora.projectId, projectId)),
        )
        .limit(1);
      if (!row) {
        return ok(null);
      }
      return ok({
        id: row.id,
        title: row.title,
        body: row.body,
        projectId: row.projectId,
      });
    } catch (error) {
      logger.error('Failed to find user story line for project', error);
      return err(new DatabaseError('Failed to find user story line'));
    }
  }

  async findByUserStoryLineId(
    userStoryLineId: string,
  ): Promise<Result<LinearIssueLink | null, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(linearIssueLinks)
        .where(eq(linearIssueLinks.userStoryLineId, userStoryLineId))
        .limit(1);
      return ok(row ? mapRow(row) : null);
    } catch (error) {
      logger.error('Failed to find linear issue link by user story line', error);
      return err(new DatabaseError('Failed to find Linear issue link'));
    }
  }

  async findByLinearIssueId(
    linearIssueId: string,
  ): Promise<Result<LinearIssueLink | null, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(linearIssueLinks)
        .where(eq(linearIssueLinks.linearIssueId, linearIssueId))
        .limit(1);
      return ok(row ? mapRow(row) : null);
    } catch (error) {
      logger.error('Failed to find linear issue link by linear id', error);
      return err(new DatabaseError('Failed to find Linear issue link'));
    }
  }

  async insert(
    draft: LinearIssueLinkDraft,
  ): Promise<Result<LinearIssueLink, ApplicationError>> {
    try {
      const insert: NewLinearIssueLinkRow = {
        projectId: draft.projectId,
        userStoryLineId: draft.userStoryLineId,
        linearIssueId: draft.linearIssueId,
        linearIssueIdentifier: draft.linearIssueIdentifier,
        status: draft.status,
      };
      const [inserted] = await db.insert(linearIssueLinks).values(insert).returning();
      return ok(mapRow(inserted));
    } catch (error) {
      logger.error('Failed to insert linear issue link', error);
      return err(new DatabaseError('Failed to persist Linear issue link'));
    }
  }

  async updateStatus(
    id: string,
    status: LinearIssueLinkStatus,
    syncedAt: Date,
  ): Promise<Result<LinearIssueLink, ApplicationError>> {
    try {
      const update = {
        status,
        lastSyncedAt: syncedAt,
      } satisfies LinearIssueLinkUpdate;
      const [updated] = await db
        .update(linearIssueLinks)
        .set(update as PgUpdateSetSource<typeof linearIssueLinks>)
        .where(eq(linearIssueLinks.id, id))
        .returning();
      if (!updated) {
        return err(new NotFoundError('Linear issue link not found'));
      }
      return ok(mapRow(updated));
    } catch (error) {
      logger.error('Failed to update linear issue link status', error);
      return err(new DatabaseError('Failed to update Linear issue link'));
    }
  }
}

export const linearIssueLinkRepository = new DrizzleLinearIssueLinkRepository();
