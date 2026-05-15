/**
 * Drizzle adapter for user story corpora + lines.
 */

import { randomUUID } from 'node:crypto';
import { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import type { SaveUserStoryLineInput, UserStoryCorpusDomain } from '@domain/user-stories/user-story-corpus';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError, NotFoundError } from '@shared/errors/application-error';
import {
  db,
  userStoryCorpora,
  userStoryLines,
  eq,
  and,
  asc,
  sql,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'UserStoryCorpusRepository' });

function mapLine(
  row: typeof userStoryLines.$inferSelect
): UserStoryCorpusDomain['lines'][number] {
  return {
    id: row.id,
    corpusId: row.corpusId,
    sortOrder: row.sortOrder,
    title: row.title,
    body: row.body,
    archivedAt: row.archivedAt,
    draftMarker: row.draftMarker,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapCorpus(
  corpusRow: typeof userStoryCorpora.$inferSelect,
  lineRows: typeof userStoryLines.$inferSelect[]
): UserStoryCorpusDomain {
  return {
    id: corpusRow.id,
    projectId: corpusRow.projectId,
    featureSplitClusterId: corpusRow.featureSplitClusterId,
    reviewReadyAt: corpusRow.reviewReadyAt,
    createdAt: corpusRow.createdAt,
    updatedAt: corpusRow.updatedAt,
    lines: lineRows.map(mapLine),
  };
}

export class DrizzleUserStoryCorpusRepository implements IUserStoryCorpusRepository {
  constructor(_db?: unknown) {}

  async findByProjectAndCluster(
    projectId: string,
    featureSplitClusterId: string
  ): Promise<Result<UserStoryCorpusDomain | null, ApplicationError>> {
    try {
      const [corpusRow] = await db
        .select()
        .from(userStoryCorpora)
        .where(
          and(
            eq(userStoryCorpora.projectId, projectId),
            eq(userStoryCorpora.featureSplitClusterId, featureSplitClusterId)
          )
        );

      if (!corpusRow) return ok(null);

      const lineRows = await db
        .select()
        .from(userStoryLines)
        .where(eq(userStoryLines.corpusId, corpusRow.id))
        .orderBy(asc(userStoryLines.sortOrder));

      return ok(mapCorpus(corpusRow, lineRows));
    } catch (error) {
      logger.error('Failed to load user story corpus', error);
      return err(new DatabaseError('Failed to load user story corpus'));
    }
  }

  async save(
    projectId: string,
    featureSplitClusterId: string,
    lines: SaveUserStoryLineInput[]
  ): Promise<Result<UserStoryCorpusDomain, ApplicationError>> {
    try {
      const saved = await db.transaction(async (tx) => {
        const [existing] = await tx
          .select()
          .from(userStoryCorpora)
          .where(
            and(
              eq(userStoryCorpora.projectId, projectId),
              eq(userStoryCorpora.featureSplitClusterId, featureSplitClusterId)
            )
          );

        const now = new Date();
        let corpusId: string;

        if (existing) {
          corpusId = existing.id;
          await tx.delete(userStoryLines).where(eq(userStoryLines.corpusId, corpusId));
          await tx
            .update(userStoryCorpora)
            .set({ updatedAt: now })
            .where(eq(userStoryCorpora.id, corpusId));
        } else {
          const [inserted] = await tx
            .insert(userStoryCorpora)
            .values({
              projectId,
              featureSplitClusterId,
              updatedAt: now,
            })
            .returning({ id: userStoryCorpora.id });
          if (!inserted) {
            throw new Error('Insert user_story_corpora returned no row');
          }
          corpusId = inserted.id;
        }

        if (lines.length > 0) {
          await tx.insert(userStoryLines).values(
            lines.map((l, i) => ({
              id: l.id ?? randomUUID(),
              corpusId,
              sortOrder: l.sortOrder ?? i,
              title: l.title,
              body: l.body,
              archivedAt: l.archivedAt ?? null,
              draftMarker: l.draftMarker ?? null,
              updatedAt: now,
            }))
          );
        }

        const [corpusRow] = await tx
          .select()
          .from(userStoryCorpora)
          .where(eq(userStoryCorpora.id, corpusId));

        if (!corpusRow) throw new Error('Corpus row missing after save');

        const lineRows = await tx
          .select()
          .from(userStoryLines)
          .where(eq(userStoryLines.corpusId, corpusId))
          .orderBy(asc(userStoryLines.sortOrder));

        return mapCorpus(corpusRow, lineRows);
      });

      return ok(saved);
    } catch (error) {
      logger.error('Failed to save user story corpus', error);
      return err(new DatabaseError('Failed to save user story corpus'));
    }
  }

  async markReviewReady(
    projectId: string,
    featureSplitClusterId: string
  ): Promise<Result<UserStoryCorpusDomain, ApplicationError>> {
    try {
      const [corpusRow] = await db
        .select()
        .from(userStoryCorpora)
        .where(
          and(
            eq(userStoryCorpora.projectId, projectId),
            eq(userStoryCorpora.featureSplitClusterId, featureSplitClusterId)
          )
        );

      if (!corpusRow) {
        return err(new NotFoundError('User story corpus not found'));
      }

      const now = new Date();
      // Drizzle's inferred `.set()` omits nullable `timestamp()` columns here; keep bound `Date` params.
      await db.execute(
        sql`UPDATE user_story_corpora SET review_ready_at = ${now}, updated_at = ${now} WHERE id = ${corpusRow.id}`
      );

      const [updatedCorpusRow] = await db
        .select()
        .from(userStoryCorpora)
        .where(eq(userStoryCorpora.id, corpusRow.id));

      if (!updatedCorpusRow) {
        return err(new DatabaseError('User story corpus missing after review-ready update'));
      }

      const lineRows = await db
        .select()
        .from(userStoryLines)
        .where(eq(userStoryLines.corpusId, corpusRow.id))
        .orderBy(asc(userStoryLines.sortOrder));

      return ok(mapCorpus(updatedCorpusRow, lineRows));
    } catch (error) {
      logger.error('Failed to mark user stories review ready', error);
      return err(new DatabaseError('Failed to mark user stories review ready'));
    }
  }
}
