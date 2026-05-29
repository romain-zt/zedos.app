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

/** User submission from DecisionCard / clarify thread */
export const ClarifyDecisionNotSureResponseSchema = z.object({
  type: z.literal('not_sure'),
  message: z.string(),
});

export const ClarifyDecisionSingleChoiceResponseSchema = z.object({
  type: z.literal('single_choice'),
  selected: z.string(),
  label: z.string().optional(),
  comment: z.string().optional(),
});

export const ClarifyDecisionMultiChoiceResponseSchema = z.object({
  type: z.literal('multi_choice'),
  selected: z.array(z.string()),
  labels: z.array(z.string()).optional(),
  custom: z.string().optional(),
  comment: z.string().optional(),
});

export const ClarifyDecisionRankedResponseSchema = z.object({
  type: z.literal('ranked'),
  ranking: z.array(z.string()),
  labels: z.array(z.string()).optional(),
  comment: z.string().optional(),
});

export const ClarifyDecisionModalFormResponseSchema = z.object({
  type: z.literal('modal_form'),
  selected: z.union([z.string(), z.array(z.string())]),
  comment: z.string().optional(),
});

export const ClarifyDecisionResponseSchema = z.discriminatedUnion('type', [
  ClarifyDecisionNotSureResponseSchema,
  ClarifyDecisionSingleChoiceResponseSchema,
  ClarifyDecisionMultiChoiceResponseSchema,
  ClarifyDecisionRankedResponseSchema,
  ClarifyDecisionModalFormResponseSchema,
]);

export type ClarifyDecisionNotSureResponse = z.infer<typeof ClarifyDecisionNotSureResponseSchema>;
export type ClarifyDecisionSingleChoiceResponse = z.infer<
  typeof ClarifyDecisionSingleChoiceResponseSchema
>;
export type ClarifyDecisionMultiChoiceResponse = z.infer<
  typeof ClarifyDecisionMultiChoiceResponseSchema
>;
export type ClarifyDecisionRankedResponse = z.infer<typeof ClarifyDecisionRankedResponseSchema>;
export type ClarifyDecisionModalFormResponse = z.infer<
  typeof ClarifyDecisionModalFormResponseSchema
>;
export type ClarifyDecisionResponse = z.infer<typeof ClarifyDecisionResponseSchema>;
