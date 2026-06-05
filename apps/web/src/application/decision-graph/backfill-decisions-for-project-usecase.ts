import type { IDecisionGraphRepository } from '@domain/decision-graph/decision-graph-repository';
import type { DecisionInsertDraft } from '@domain/decision-graph/decision';
import { mapQuestionHistoryRowToDecisionDraft } from '@domain/decision-graph/map-question-history-to-decision';
import { DecisionDraftSchema } from '@repo/contracts/decisions/decision';
import type { QuestionHistoryRow } from '@repo/contracts/questions/history';
import { Result, err, ok } from '@repo/result';
import type { ApplicationError } from '@shared/errors/application-error';
import type { BackfillDecisionsResponse } from '@repo/contracts/decisions/decision';

const BATCH_SIZE = 200;

export async function backfillDecisionsForProjectUseCase(
  rows: QuestionHistoryRow[],
  repo: IDecisionGraphRepository,
): Promise<Result<BackfillDecisionsResponse, ApplicationError>> {
  let scanned = 0;
  let inserted = 0;
  let skipped = 0;

  for (let offset = 0; offset < rows.length; offset += BATCH_SIZE) {
    const batch = rows.slice(offset, offset + BATCH_SIZE);
    const candidateIds = batch.map((r) => r.id);
    const existingResult = await repo.findQuestionHistoryIdsAlreadyPersisted(
      batch[0]?.projectId ?? '',
      candidateIds,
    );
    if (existingResult.isErr()) {
      return err(existingResult.error);
    }
    const existing = existingResult.unwrap();

    for (const row of batch) {
      scanned += 1;
      if (existing.has(row.id)) {
        skipped += 1;
        continue;
      }

      const draft = mapQuestionHistoryRowToDecisionDraft(row);
      const validated = DecisionDraftSchema.safeParse(draft);
      if (!validated.success) {
        skipped += 1;
        continue;
      }

      const draftRow: DecisionInsertDraft = {
        projectId: validated.data.projectId,
        prdVersionId: validated.data.prdVersionId,
        questionHistoryId: validated.data.questionHistoryId,
        structuredQuestion: validated.data.structuredQuestion,
        chosenOption: validated.data.chosenOption,
        rejectedOptions: validated.data.rejectedOptions,
        ownerComment: validated.data.ownerComment,
        aiInterpretation: validated.data.aiInterpretation,
        sectionId: validated.data.sectionId,
      };
      const insertResult = await repo.insertDecisionIfAbsent(draftRow);
      if (insertResult.isErr()) {
        skipped += 1;
        continue;
      }
      if (insertResult.unwrap().created) {
        inserted += 1;
      } else {
        skipped += 1;
      }
    }
  }

  return ok({ scanned, inserted, skipped });
}
