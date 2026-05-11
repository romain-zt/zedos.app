import { z } from 'zod';
import { ClarifyDecisionUiSchema } from '../ai/decision-ui';

export const ClarifyPostBodySchema = z
  .object({
    message: z.string().optional(),
    decisionResponse: z.unknown().optional(),
    prdVersionId: z.union([z.string().min(1), z.null()]).optional(),
  })
  .passthrough();

export type ClarifyPostBody = z.infer<typeof ClarifyPostBodySchema>;

/** Coerce legacy / invalid JSON in `available_options` to null for outbound DTOs */
const AvailableOptionsFromDbSchema = z.preprocess((val) => {
  if (val == null) return null;
  const r = ClarifyDecisionUiSchema.safeParse(val);
  return r.success ? r.data : null;
}, ClarifyDecisionUiSchema.nullable());

export const QuestionHistoryRowSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  prdVersionId: z.string().nullable(),
  structuredQuestion: z.string(),
  availableOptions: AvailableOptionsFromDbSchema,
  founderAnswer: z.string().nullable(),
  optionalComment: z.string().nullable(),
  aiInterpretation: z.string().nullable(),
  prdImpact: z.string().nullable(),
  questionType: z.string(),
  createdAt: z.coerce.date(),
});

export const QuestionHistoryListResponseSchema = z.array(QuestionHistoryRowSchema);

export type QuestionHistoryRow = z.infer<typeof QuestionHistoryRowSchema>;
