import type { PrdSection } from '@repo/contracts/questions/history';

export interface DecisionLink {
  id: string;
  decisionId: string;
  sectionId: PrdSection;
  anchor: string | null;
  createdAt: Date;
}

export interface Decision {
  id: string;
  projectId: string;
  prdVersionId: string | null;
  questionHistoryId: string;
  structuredQuestion: string;
  chosenOption: string | null;
  rejectedOptions: string[];
  ownerComment: string | null;
  aiInterpretation: string | null;
  sectionIds: PrdSection[];
  createdAt: Date;
}

export interface DecisionInsertDraft {
  projectId: string;
  prdVersionId: string | null;
  questionHistoryId: string;
  structuredQuestion: string;
  chosenOption: string | null;
  rejectedOptions: string[];
  ownerComment: string | null;
  aiInterpretation: string | null;
  sectionId: PrdSection | null;
}
