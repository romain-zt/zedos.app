/**
 * Drizzle adapter for IUserStoryCorpusRepository.
 */

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
  featureSplitClusters,
  featureSplits,
  eq,
  and,
  asc,
  type NewUserStoryCorpusRow,
  type NewUserStoryLineRow,
} from '@repo/db';
import {
  ApplicationError,
  DatabaseError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '@shared/errors/application-error';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'UserStoryCorpusRepository' });

/** Persisted corpus header shape (explicit — avoids Drizzle $inferSelect exports). */
interface UserStoryCorpusRow {
  id: string;
  projectId: string;
  featureSplitClusterId: string;
  reviewReadyAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type SaveTransactionResult =
  | { tag: 'err'; error: ApplicationError }
  | { tag: 'ok'; corpus: UserStoryCorpusRow; lines: UserStoryLineDomain[] };

type DbExecutor = Pick<typeof db, 'select' | 'insert' | 'delete' | 'update'>;

async function assertConfirmedClusterForProject(
  executor: DbExecutor,
  projectId: string,
  featureSplitClusterId: string
): Promise<Result<void, ApplicationError>> {
  try {
    const [row] = await executor
      .select({ id: featureSplitClusters.id })
      .from(featureSplitClusters)
      .innerJoin(featureSplits, eq(featureSplitClusters.featureSplitId, featureSplits.id))
      .where(
        and(
          eq(featureSplitClusters.id, featureSplitClusterId),
          eq(featureSplits.projectId, projectId),
          eq(featureSplits.status, 'confirmed')
        )
      )
      .limit(1);

    if (!row) {
      return err(
        new ValidationError(
          'Feature split cluster is not confirmed for this project'
        )
      );
    }
    return ok(undefined);
  } catch (error) {
    logger.error('Failed to validate feature split cluster scope', error);
    return err(new DatabaseError('Failed to validate feature split cluster'));
  }
}

function mapLineRow(row: {
  id: string;
  corpusId: string;
  sortOrder: number;
  title: string;
  body: string;
  archivedAt: Date | null;
  draftMarker: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}): UserStoryLineDomain {
  const updatedAt = row.updatedAt ?? row.createdAt;
  return {
    id: row.id,
    corpusId: row.corpusId,
    sortOrder: row.sortOrder,
    title: row.title,
    body: row.body,
    archivedAt: row.archivedAt,
    draftMarker: row.draftMarker,
    createdAt: row.createdAt,
    updatedAt,
  };
}

async function loadLinesForCorpus(corpusId: string): Promise<UserStoryLineDomain[]> {
  const rows = await db
    .select()
    .from(userStoryLines)
    .where(eq(userStoryLines.corpusId, corpusId))
    .orderBy(asc(userStoryLines.sortOrder));
  return rows.map(mapLineRow);
}

function mapCorpusRow(corpus: UserStoryCorpusRow, lines: UserStoryLineDomain[]): UserStoryCorpusDomain {
  return {
    id: corpus.id,
    projectId: corpus.projectId,
    featureSplitClusterId: corpus.featureSplitClusterId,
    reviewReadyAt: corpus.reviewReadyAt,
    createdAt: corpus.createdAt,
    updatedAt: corpus.updatedAt,
    lines,
  };
}

export class DrizzleUserStoryCorpusRepository implements IUserStoryCorpusRepository {
  constructor(_db?: unknown) {}

  async findByProjectAndCluster(
    projectId: string,
    featureSplitClusterId: string
  ): Promise<Result<UserStoryCorpusDomain | null, ApplicationError>> {
    try {
      const gate = await assertConfirmedClusterForProject(
        db,
        projectId,
        featureSplitClusterId
      );
      if (gate.isErr()) return err(gate.error);

      const [corpus] = await db
        .select()
        .from(userStoryCorpora)
        .where(
          and(
            eq(userStoryCorpora.projectId, projectId),
            eq(userStoryCorpora.featureSplitClusterId, featureSplitClusterId)
          )
        )
        .limit(1);

      if (!corpus) {
        return ok(null);
      }

      const lines = await loadLinesForCorpus(corpus.id);
      return ok(mapCorpusRow(corpus, lines));
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
      const txResult = await db.transaction(async (tx): Promise<SaveTransactionResult> => {
        const gate = await assertConfirmedClusterForProject(
          tx,
          projectId,
          featureSplitClusterId
        );
        if (gate.isErr()) return { tag: 'err', error: gate.error };

        let [corpus] = await tx
          .select()
          .from(userStoryCorpora)
          .where(eq(userStoryCorpora.featureSplitClusterId, featureSplitClusterId))
          .limit(1);

        if (!corpus) {
          const insertRow: NewUserStoryCorpusRow = {
            id: randomUUID(),
            projectId,
            featureSplitClusterId,
            updatedAt: new Date(),
          };
          const [inserted] = await tx.insert(userStoryCorpora).values(insertRow).returning();
          corpus = inserted;
        } else {
          if (corpus.projectId !== projectId) {
            return {
              tag: 'err',
              error: new ForbiddenError('User story corpus belongs to another project'),
            };
          }
          const touch = { updatedAt: new Date() };
          const [updated] = await tx
            .update(userStoryCorpora)
            // Drizzle omits $onUpdate columns from inferred `.set()` types — same workaround as feature-split-repository.
            .set(touch as any)
            .where(eq(userStoryCorpora.id, corpus.id))
            .returning();
          corpus = updated ?? corpus;
        }

        await tx.delete(userStoryLines).where(eq(userStoryLines.corpusId, corpus.id));

        const lineRows: NewUserStoryLineRow[] = lines.map((line) => ({
          id: line.id ?? randomUUID(),
          corpusId: corpus.id,
          sortOrder: line.sortOrder,
          title: line.title,
          body: line.body,
          archivedAt: line.archivedAt ?? null,
          draftMarker: line.draftMarker ?? null,
          updatedAt: new Date(),
        }));

        const insertedLines =
          lineRows.length > 0
            ? await tx.insert(userStoryLines).values(lineRows).returning()
            : [];

        return {
          tag: 'ok',
          corpus: corpus as UserStoryCorpusRow,
          lines: insertedLines.map(mapLineRow),
        };
      });

      if (txResult.tag === 'err') {
        return err(txResult.error);
      }

      return ok(mapCorpusRow(txResult.corpus, txResult.lines));
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
      const gate = await assertConfirmedClusterForProject(db, projectId, featureSplitClusterId);
      if (gate.isErr()) return err(gate.error);

      const now = new Date();
      const updatePayload = { reviewReadyAt: now, updatedAt: now };

      const [updated] = await db
        .update(userStoryCorpora)
        .set(updatePayload as any)
        .where(
          and(
            eq(userStoryCorpora.projectId, projectId),
            eq(userStoryCorpora.featureSplitClusterId, featureSplitClusterId)
          )
        )
        .returning();

      if (!updated) {
        return err(new NotFoundError('User story corpus not found'));
      }

      const loadedLines = await loadLinesForCorpus(updated.id);
      return ok(mapCorpusRow(updated, loadedLines));
    } catch (error) {
      logger.error('Failed to mark user stories review ready', error);
      return err(new DatabaseError('Failed to mark user stories review ready'));
    }
  }
}
