import { z } from 'zod';

const DecisionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

const DecisionUiSchema = z.object({
  type: z.enum(['single_choice', 'multi_choice', 'ranked', 'modal_form']),
  title: z.string(),
  description: z.string(),
  options: z.array(DecisionOptionSchema),
  allow_custom: z.boolean(),
  allow_not_sure: z.boolean(),
});

/**
 * Parsed JSON object from the clarification streaming response (Abacus / OpenAI-compatible SSE aggregate).
 * Matches the system prompt in the clarify route.
 */
export const ClarificationStreamJsonSchema = z.object({
  reasoning: z.string(),
  message: z.string(),
  decision_ui: DecisionUiSchema.nullable(),
  prd_section_affected: z.string(),
  progress_hint: z.string(),
  suggested_credit_type: z.enum(['clarification', 'decision', 'mini_form']),
});

export type ClarificationStreamJson = z.infer<typeof ClarificationStreamJsonSchema>;
