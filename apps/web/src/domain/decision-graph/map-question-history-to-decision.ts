import {
  AvailableOptionsFromDbSchema,
  PRD_SECTIONS,
  type PrdSection,
  type QuestionHistoryRow,
} from '@repo/contracts/questions/history';
import { ClarifyDecisionResponseSchema } from '@repo/contracts/ai/decision-ui';
import type { DecisionInsertDraft } from './decision';

const PRD_SECTION_SET = new Set<string>(PRD_SECTIONS);

function isPrdSection(value: string | null | undefined): value is PrdSection {
  return value != null && PRD_SECTION_SET.has(value);
}

function parseFounderAnswer(
  founderAnswer: string | null,
  availableOptions: ReturnType<typeof AvailableOptionsFromDbSchema.parse>,
): { chosenOption: string | null; rejectedOptions: string[]; ownerComment: string | null } {
  if (!founderAnswer) {
    return { chosenOption: null, rejectedOptions: [], ownerComment: null };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(founderAnswer);
  } catch {
    return {
      chosenOption: founderAnswer.trim() || null,
      rejectedOptions: [],
      ownerComment: null,
    };
  }

  const decisionParsed = ClarifyDecisionResponseSchema.safeParse(parsedJson);
  if (!decisionParsed.success) {
    return {
      chosenOption: founderAnswer.trim() || null,
      rejectedOptions: [],
      ownerComment: null,
    };
  }

  const response = decisionParsed.data;
  const optionLabels = (availableOptions?.options ?? []).map((o) => o.label);

  switch (response.type) {
    case 'not_sure':
      return {
        chosenOption: response.message,
        rejectedOptions: optionLabels,
        ownerComment: null,
      };
    case 'single_choice':
      return {
        chosenOption: response.label ?? response.selected,
        rejectedOptions: optionLabels.filter(
          (label) => label !== (response.label ?? response.selected),
        ),
        ownerComment: response.comment ?? null,
      };
    case 'multi_choice': {
      const chosen = response.labels ?? response.selected;
      const chosenSet = new Set(chosen);
      return {
        chosenOption: chosen.join(', '),
        rejectedOptions: optionLabels.filter((label) => !chosenSet.has(label)),
        ownerComment: response.comment ?? response.custom ?? null,
      };
    }
    case 'ranked':
      return {
        chosenOption: (response.labels ?? response.ranking).join(' > '),
        rejectedOptions: [],
        ownerComment: response.comment ?? null,
      };
    case 'modal_form': {
      const selected = response.selected;
      const chosenOption = Array.isArray(selected) ? selected.join(', ') : selected;
      return {
        chosenOption,
        rejectedOptions: [],
        ownerComment: response.comment ?? null,
      };
    }
  }
}

export function mapQuestionHistoryRowToDecisionDraft(
  row: Pick<
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
): DecisionInsertDraft {
  const availableOptions = AvailableOptionsFromDbSchema.parse(row.availableOptions);
  const { chosenOption, rejectedOptions, ownerComment } = parseFounderAnswer(
    row.founderAnswer,
    availableOptions,
  );

  return {
    projectId: row.projectId,
    prdVersionId: row.prdVersionId,
    questionHistoryId: row.id,
    structuredQuestion: row.structuredQuestion,
    chosenOption,
    rejectedOptions,
    ownerComment: ownerComment ?? row.optionalComment,
    aiInterpretation: row.aiInterpretation,
    sectionId: isPrdSection(row.prdImpact) ? row.prdImpact : null,
  };
}
