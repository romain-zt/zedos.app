import { z } from 'zod';
import { ClarifyDecisionUiSchema } from './decision-ui';

export { ClarifyDecisionOptionSchema, ClarifyDecisionUiSchema } from './decision-ui';

/**
 * Parsed JSON object from the streaming clarify completion buffer (one assistant turn).
 * Validate before persisting question_history or deducting credits.
 */
export const ClarifyAiResponseSchema = z.object({
  reasoning: z.string(),
  message: z.string(),
  decision_ui: ClarifyDecisionUiSchema.nullable(),
  prd_section_affected: z.string(),
  progress_hint: z.string().optional(),
  suggested_credit_type: z.enum(['clarification', 'decision', 'mini_form']),
});

export type ClarifyAiResponse = z.infer<typeof ClarifyAiResponseSchema>;
