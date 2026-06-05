import type { IDecisionGraphRepository } from '@domain/decision-graph/decision-graph-repository';
import type { DecisionInsertDraft } from '@domain/decision-graph/decision';
import { mapQuestionHistoryRowToDecisionDraft } from '@domain/decision-graph/map-question-history-to-decision';
import type { QuestionHistoryRow } from '@repo/contracts/questions/history';
import { DecisionDraftSchema } from '@repo/contracts/decisions/decision';
import { Result, err, ok } from '@repo/result';
import { ApplicationError, ValidationError } from '@shared/errors/application-error';

export async function persistDecisionFromQuestionHistoryEntryUseCase(
  entry: Pick<
    QuestionHistoryRow,
    | 'id'
    | 'projectId'
    | 'prdVersionId'
    | 'structuredQuestion'
    | 'availableOptions'
    | 'founderAnswer'
    | 'optionalComment'
    | 'aiInterpretation'
    | 'prdImpact'
  >,
  repo: IDecisionGraphRepository,
): Promise<Result<{ created: boolean }, ApplicationError>> {
  const draft = mapQuestionHistoryRowToDecisionDraft(entry);
  const validated = DecisionDraftSchema.safeParse(draft);
  if (!validated.success) {
    return err(new ValidationError('Invalid decision draft from question history'));
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
    return err(insertResult.error);
  }

  return ok({ created: insertResult.unwrap().created });
}
