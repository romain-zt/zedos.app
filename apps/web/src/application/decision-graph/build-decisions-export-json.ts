import type { DecisionsExportJson } from '@repo/contracts/decisions/decision';
import type { Decision } from '@domain/decision-graph/decision';

export function buildDecisionsExportJson(
  projectId: string,
  decisionRows: Decision[],
): DecisionsExportJson {
  return {
    version: 1,
    projectId,
    exportedAt: new Date().toISOString(),
    decisions: decisionRows.map((decision) => ({
      question: decision.structuredQuestion,
      chosenOption: decision.chosenOption,
      rejectedOptions: decision.rejectedOptions,
      ownerComment: decision.ownerComment,
      aiInterpretation: decision.aiInterpretation,
      sectionIds: decision.sectionIds,
      createdAt: decision.createdAt.toISOString(),
    })),
  };
}
