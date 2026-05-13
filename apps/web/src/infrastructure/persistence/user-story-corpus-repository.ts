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

        let corpusId: string;
        const now = new Date();

        if (existing) {
          corpusId = existing.id;
          await tx.delete(userStoryLines).where(eq(userStoryLines.corpusId, corpusId));
          await tx.execute(
            sql`UPDATE user_story_corpora SET updated_at = ${now} WHERE id = ${corpusId}`
          );
        } else {
          const insertedRows = await tx.execute(
            sql`
              INSERT INTO user_story_corpora (
                id,
                project_id,
                feature_split_cluster_id,
                created_at,
                updated_at
              )
              VALUES (${randomUUID()}, ${projectId}, ${featureSplitClusterId}, ${now}, ${now})
              RETURNING id
            `
          );
          const [inserted] = insertedRows as unknown as Array<{ id: string }>;
          if (!inserted) {
            throw new Error('Insert user_story_corpora returned no row');
          }
          corpusId = inserted.id;
        }

        if (lines.length > 0) {
          const lineInsertRows = lines.map((l) => ({
              id: l.id ?? randomUUID(),
              sortOrder: l.sortOrder,
              title: l.title,
              body: l.body,
              archivedAt: l.archivedAt ?? null,
              draftMarker: l.draftMarker ?? null,
            }));

          await tx.execute(
            sql`
              INSERT INTO user_story_lines (
                id,
                corpus_id,
                sort_order,
                title,
                body,
                archived_at,
                draft_marker,
                created_at,
                updated_at
              )
              VALUES ${sql.join(
                lineInsertRows.map(
                  (line) => sql`
                    (
                      ${line.id},
                      ${corpusId},
                      ${line.sortOrder},
                      ${line.title},
                      ${line.body},
                      ${line.archivedAt},
                      ${line.draftMarker},
                      ${now},
                      ${now}
                    )
                  `
                ),
                sql`, `
              )}
            `
          );
        }

        const [corpusRow] = await tx
          .select()
          .from(userStoryCorpora)
          .where(eq(userStoryCorpora.id, corpusId));

        if (!corpusRow) {
          throw new Error('Corpus row missing after save');
        }

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
      await db.execute(
        sql`UPDATE user_story_corpora SET review_ready_at = ${now}, updated_at = ${now} WHERE id = ${corpusRow.id}`
      );

      const lineRows = await db
        .select()
        .from(userStoryLines)
        .where(eq(userStoryLines.corpusId, corpusRow.id))
        .orderBy(asc(userStoryLines.sortOrder));

      const updatedCorpus = { ...corpusRow, reviewReadyAt: now, updatedAt: now };
      return ok(mapCorpus(updatedCorpus, lineRows));
    } catch (error) {
      logger.error('Failed to mark user stories review ready', error);
      return err(new DatabaseError('Failed to mark user stories review ready'));
    }
  }
}
