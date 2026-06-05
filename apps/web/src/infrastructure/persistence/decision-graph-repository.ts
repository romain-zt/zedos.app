import type { PrdSection } from '@repo/contracts/questions/history';
import type { IDecisionGraphRepository } from '@domain/decision-graph/decision-graph-repository';
import type { Decision, DecisionInsertDraft } from '@domain/decision-graph/decision';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, DatabaseError } from '@shared/errors/application-error';
import {
  db,
  decisions,
  decisionLinks,
  eq,
  and,
  desc,
  inArray,
  sql,
  type DecisionGraphInsertRow,
  type DecisionGraphLinkInsertRow,
} from '@repo/db';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'DecisionGraphRepository' });

function mapDecisionRow(
  row: typeof decisions.$inferSelect,
  sectionIds: PrdSection[],
): Decision {
  return {
    id: row.id,
    projectId: row.projectId,
    prdVersionId: row.prdVersionId,
    questionHistoryId: row.questionHistoryId,
    structuredQuestion: row.structuredQuestion,
    chosenOption: row.chosenOption,
    rejectedOptions: Array.isArray(row.rejectedOptions) ? row.rejectedOptions : [],
    ownerComment: row.ownerComment,
    aiInterpretation: row.aiInterpretation,
    sectionIds,
    createdAt: row.createdAt,
  };
}

export class DrizzleDecisionGraphRepository implements IDecisionGraphRepository {
  async insertDecisionIfAbsent(
    draft: DecisionInsertDraft,
  ): Promise<Result<{ created: boolean; decisionId: string | null }, ApplicationError>> {
    try {
      return await db.transaction(async (tx) => {
        const decisionInsert: DecisionGraphInsertRow = {
          projectId: draft.projectId,
          prdVersionId: draft.prdVersionId,
          questionHistoryId: draft.questionHistoryId,
          structuredQuestion: draft.structuredQuestion,
          chosenOption: draft.chosenOption,
          rejectedOptions: draft.rejectedOptions,
          ownerComment: draft.ownerComment,
          aiInterpretation: draft.aiInterpretation,
        };
        const [inserted] = await tx
          .insert(decisions)
          .values(decisionInsert)
          .onConflictDoNothing({ target: decisions.questionHistoryId })
          .returning({ id: decisions.id });

        if (!inserted) {
          return ok({ created: false, decisionId: null });
        }

        if (draft.sectionId) {
          const linkInsert: DecisionGraphLinkInsertRow = {
            decisionId: inserted.id,
            sectionId: draft.sectionId,
            anchor: null,
          };
          await tx.insert(decisionLinks).values(linkInsert);
        }

        return ok({ created: true, decisionId: inserted.id });
      });
    } catch (error) {
      logger.error('Failed to insert decision', error);
      return err(new DatabaseError('Failed to insert decision'));
    }
  }

  async findByProjectId(
    projectId: string,
    limit = 500,
  ): Promise<Result<Decision[], ApplicationError>> {
    try {
      const rows = await db
        .select()
        .from(decisions)
        .where(eq(decisions.projectId, projectId))
        .orderBy(desc(decisions.createdAt))
        .limit(limit);

      if (rows.length === 0) {
        return ok([]);
      }

      const decisionIds = rows.map((r) => r.id);
      const linkRows = await db
        .select()
        .from(decisionLinks)
        .where(inArray(decisionLinks.decisionId, decisionIds));

      const sectionsByDecision = new Map<string, PrdSection[]>();
      for (const link of linkRows) {
        const existing = sectionsByDecision.get(link.decisionId) ?? [];
        existing.push(link.sectionId as PrdSection);
        sectionsByDecision.set(link.decisionId, existing);
      }

      return ok(rows.map((row) => mapDecisionRow(row, sectionsByDecision.get(row.id) ?? [])));
    } catch (error) {
      logger.error('Failed to list decisions', error);
      return err(new DatabaseError('Failed to list decisions'));
    }
  }

  async findQuestionHistoryIdsAlreadyPersisted(
    projectId: string,
    candidateIds: string[],
  ): Promise<Result<Set<string>, ApplicationError>> {
    if (candidateIds.length === 0) {
      return ok(new Set());
    }
    try {
      const rows = await db
        .select({ questionHistoryId: decisions.questionHistoryId })
        .from(decisions)
        .where(
          and(eq(decisions.projectId, projectId), inArray(decisions.questionHistoryId, candidateIds)),
        );

      return ok(new Set(rows.map((r) => r.questionHistoryId)));
    } catch (error) {
      logger.error('Failed to find persisted question history ids', error);
      return err(new DatabaseError('Failed to query existing decisions'));
    }
  }

  async countBySectionForProject(
    projectId: string,
  ): Promise<Result<Record<string, number>, ApplicationError>> {
    try {
      const rows = await db
        .select({
          sectionId: decisionLinks.sectionId,
          count: sql<number>`count(distinct ${decisionLinks.decisionId})::int`,
        })
        .from(decisionLinks)
        .innerJoin(decisions, eq(decisionLinks.decisionId, decisions.id))
        .where(eq(decisions.projectId, projectId))
        .groupBy(decisionLinks.sectionId);

      const counts: Record<string, number> = {};
      for (const row of rows) {
        counts[row.sectionId] = row.count;
      }
      return ok(counts);
    } catch (error) {
      logger.error('Failed to count decisions by section', error);
      return err(new DatabaseError('Failed to count decisions by section'));
    }
  }
}

export const decisionGraphRepository = new DrizzleDecisionGraphRepository();
