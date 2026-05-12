import { randomUUID } from 'node:crypto';
import { IUserStoryCorpusRepository } from '@domain/user-stories/user-story-corpus-repository';
import {
  SaveUserStoryLineInput,
  UserStoryCorpusDomain,
  UserStoryLineDomain,
} from '@domain/user-stories/user-story-corpus';
import { Result, ok, err } from '@repo/result';
import {
  db,
  userStoryCorpora,
  userStoryLines,
  eq,
  and,
  asc,
  type NewUserStoryCorpus,
  type NewUserStoryLine,
} from '@repo/db';
import { ApplicationError, DatabaseError, NotFoundError } from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'UserStoryCorpusRepository' });

function mapLine(row: typeof userStoryLines.$inferSelect): UserStoryLineDomain {
  return {
    id: row.id,
    corpusId: row.corpusId,
    sortOrder: row.sortOrder,
    title: row.title,
    body: row.body,
    archivedAt: row.archivedAt ?? null,
    draftMarker: row.draftMarker ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function selectLinesOrdered(corpusId: string): Promise<typeof userStoryLines.$inferSelect[]> {
  return db
    .select()
    .from(userStoryLines)
    .where(eq(userStoryLines.corpusId, corpusId))
    .orderBy(asc(userStoryLines.sortOrder));
}

async function mapCorpusRow(
  row: typeof userStoryCorpora.$inferSelect
): Promise<UserStoryCorpusDomain> {
  const lines = await selectLinesOrdered(row.id);
  return {
    id: row.id,
    projectId: row.projectId,
    featureSplitClusterId: row.featureSplitClusterId,
    reviewReadyAt: row.reviewReadyAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lines: lines.map(mapLine),
  };
}

export class DrizzleUserStoryCorpusRepository implements IUserStoryCorpusRepository {
  constructor(_db?: unknown) {}

  async findByProjectAndCluster(
    projectId: string,
    featureSplitClusterId: string
  ): Promise<Result<UserStoryCorpusDomain | null, ApplicationError>> {
    try {
      const [row] = await db
        .select()
        .from(userStoryCorpora)
        .where(
          and(
            eq(userStoryCorpora.projectId, projectId),
            eq(userStoryCorpora.featureSplitClusterId, featureSplitClusterId)
          )
        )
        .limit(1);

      if (!row) return ok(null);
      return ok(await mapCorpusRow(row));
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
      const domain = await db.transaction(async (tx) => {
        let [existing] = await tx
          .select()
          .from(userStoryCorpora)
          .where(
            and(
              eq(userStoryCorpora.projectId, projectId),
              eq(userStoryCorpora.featureSplitClusterId, featureSplitClusterId)
            )
          )
          .limit(1);

        let corpusId: string;

        if (!existing) {
          const insertPayload: NewUserStoryCorpus = {
            projectId,
            featureSplitClusterId,
          };
          const [inserted] = await tx
            .insert(userStoryCorpora)
            .values(insertPayload)
            .returning();
          if (!inserted) {
            throw new Error('Insert corpus returned empty');
          }
          existing = inserted;
          corpusId = inserted.id;
        } else {
          corpusId = existing.id;
          await tx.delete(userStoryLines).where(eq(userStoryLines.corpusId, corpusId));
        }

        const sortedInputs = [...lines].sort((a, b) => a.sortOrder - b.sortOrder);
        const lineRows: NewUserStoryLine[] = sortedInputs.map((line, index) => ({
          corpusId,
          sortOrder: line.sortOrder ?? index,
          title: line.title,
          body: line.body,
          archivedAt: line.archivedAt ?? null,
          draftMarker: line.draftMarker ?? null,
        }));

        if (lineRows.length > 0) {
          await tx.insert(userStoryLines).values(lineRows);
        }

        const [header] = await tx
          .select()
          .from(userStoryCorpora)
          .where(eq(userStoryCorpora.id, corpusId))
          .limit(1);

        if (!header) {
          throw new Error('Corpus header missing after save');
        }

        const loadedLines = await tx
          .select()
          .from(userStoryLines)
          .where(eq(userStoryLines.corpusId, corpusId))
          .orderBy(asc(userStoryLines.sortOrder));

        const linesDomain = loadedLines.map(mapLine);
        return {
          id: header.id,
          projectId: header.projectId,
          featureSplitClusterId: header.featureSplitClusterId,
          reviewReadyAt: header.reviewReadyAt ?? null,
          createdAt: header.createdAt,
          updatedAt: header.updatedAt,
          lines: linesDomain,
        };
      });

      return ok(domain);
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
      const [existing] = await db
        .select()
        .from(userStoryCorpora)
        .where(
          and(
            eq(userStoryCorpora.projectId, projectId),
            eq(userStoryCorpora.featureSplitClusterId, featureSplitClusterId)
          )
        )
        .limit(1);

      if (!existing) {
        return err(new NotFoundError('User story corpus not found for this cluster'));
      }

      const now = new Date();
      const [updated] = await db
        .update(userStoryCorpora)
        .set({ reviewReadyAt: now, updatedAt: now } as any)
        .where(eq(userStoryCorpora.id, existing.id))
        .returning();

      if (!updated) {
        return err(new DatabaseError('Failed to mark corpus review-ready'));
      }

      const lines = await selectLinesOrdered(updated.id);
      return ok({
        id: updated.id,
        projectId: updated.projectId,
        featureSplitClusterId: updated.featureSplitClusterId,
        reviewReadyAt: updated.reviewReadyAt ?? null,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        lines: lines.map(mapLine),
      });
    } catch (error) {
      logger.error('Failed to mark user story corpus review-ready', error);
      return err(new DatabaseError('Failed to mark user story corpus review-ready'));
    }
  }
}
