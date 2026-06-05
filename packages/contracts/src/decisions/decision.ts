import { z } from 'zod';
import { PRD_SECTIONS } from '../questions/history';

export const DecisionLinkDTOSchema = z.object({
  id: z.string(),
  decisionId: z.string(),
  sectionId: z.enum(PRD_SECTIONS),
  anchor: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type DecisionLinkDTO = z.infer<typeof DecisionLinkDTOSchema>;

export const DecisionDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  prdVersionId: z.string().nullable(),
  questionHistoryId: z.string(),
  structuredQuestion: z.string(),
  chosenOption: z.string().nullable(),
  rejectedOptions: z.array(z.string()),
  ownerComment: z.string().nullable(),
  aiInterpretation: z.string().nullable(),
  sectionIds: z.array(z.enum(PRD_SECTIONS)),
  createdAt: z.coerce.date(),
});

export type DecisionDTO = z.infer<typeof DecisionDTOSchema>;

export const DecisionDraftSchema = z.object({
  projectId: z.string(),
  prdVersionId: z.string().nullable(),
  questionHistoryId: z.string(),
  structuredQuestion: z.string(),
  chosenOption: z.string().nullable(),
  rejectedOptions: z.array(z.string()),
  ownerComment: z.string().nullable(),
  aiInterpretation: z.string().nullable(),
  sectionId: z.enum(PRD_SECTIONS).nullable(),
});

export type DecisionDraft = z.infer<typeof DecisionDraftSchema>;

export const BackfillDecisionsResponseSchema = z.object({
  scanned: z.number().int().min(0),
  inserted: z.number().int().min(0),
  skipped: z.number().int().min(0),
});

export type BackfillDecisionsResponse = z.infer<typeof BackfillDecisionsResponseSchema>;

export const DecisionListResponseSchema = z.array(DecisionDTOSchema);

export type DecisionListResponse = z.infer<typeof DecisionListResponseSchema>;

export const SectionDecisionCountsResponseSchema = z.record(z.string(), z.number().int().min(0));

export type SectionDecisionCountsResponse = z.infer<typeof SectionDecisionCountsResponseSchema>;

export const DecisionsExportJsonSchema = z.object({
  version: z.literal(1),
  projectId: z.string(),
  exportedAt: z.string(),
  decisions: z.array(
    z.object({
      question: z.string(),
      chosenOption: z.string().nullable(),
      rejectedOptions: z.array(z.string()),
      ownerComment: z.string().nullable(),
      aiInterpretation: z.string().nullable(),
      sectionIds: z.array(z.enum(PRD_SECTIONS)),
      createdAt: z.string(),
    }),
  ),
});

export type DecisionsExportJson = z.infer<typeof DecisionsExportJsonSchema>;
