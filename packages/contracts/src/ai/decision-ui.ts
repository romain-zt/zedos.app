import { z } from 'zod';

/** Options inside decision_ui from the clarify system prompt / model output */
export const ClarifyDecisionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
});

export const ClarifyDecisionUiSchema = z.object({
  type: z.enum(['single_choice', 'multi_choice', 'ranked', 'modal_form']),
  title: z.string(),
  description: z.string(),
  options: z.array(ClarifyDecisionOptionSchema),
  allow_custom: z.boolean(),
  allow_not_sure: z.boolean(),
});

export type ClarifyDecisionOption = z.infer<typeof ClarifyDecisionOptionSchema>;
export type ClarifyDecisionUi = z.infer<typeof ClarifyDecisionUiSchema>;
