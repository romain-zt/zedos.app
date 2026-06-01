import { z } from 'zod';
import { ClarifyDecisionResponseSchema } from '../ai/decision-ui';
import { AvailableOptionsFromDbSchema } from './history';
import { IdSchema } from '../shared/common';

/** POST /api/projects/:id/clarify body */
export const ProjectClarifyRequestSchema = z.object({
  message: z.string().optional(),
  optionalComment: z.string().max(8000).optional(),
  decisionResponse: ClarifyDecisionResponseSchema.optional(),
  prdVersionId: IdSchema.nullable().optional(),
});

export type ProjectClarifyRequest = z.infer<typeof ProjectClarifyRequestSchema>;

/** Question history row returned by GET /api/projects/:id/questions */
export const QuestionHistoryEntryDTOSchema = z.object({
  id: IdSchema,
  projectId: IdSchema,
  prdVersionId: IdSchema.nullable(),
  structuredQuestion: z.string(),
  availableOptions: AvailableOptionsFromDbSchema,
  founderAnswer: z.string().nullable(),
  optionalComment: z.string().nullable(),
  aiInterpretation: z.string().nullable(),
  prdImpact: z.string().nullable(),
  questionType: z.string(),
  createdAt: z.coerce.date(),
});

export type QuestionHistoryEntryDTO = z.infer<typeof QuestionHistoryEntryDTOSchema>;

export const QuestionHistoryListResponseSchema = z.array(QuestionHistoryEntryDTOSchema);
export type QuestionHistoryListResponse = z.infer<typeof QuestionHistoryListResponseSchema>;
