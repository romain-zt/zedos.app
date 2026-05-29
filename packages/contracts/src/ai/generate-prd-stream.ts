import { z } from 'zod';

/** One section in the PRD JSON emitted by the generate-prd AI prompt */
export const GeneratePrdSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  open_questions: z.array(z.string()),
});

/**
 * Parsed JSON from the streaming PRD-generation completion buffer.
 * Validate before persisting prd_versions or deducting prd_generation credits.
 */
export const GeneratePrdAiResponseSchema = z.object({
  title: z.string(),
  version_summary: z.string(),
  sections: z.array(GeneratePrdSectionSchema),
});

export type GeneratePrdAiResponse = z.infer<typeof GeneratePrdAiResponseSchema>;
export type GeneratePrdSection = z.infer<typeof GeneratePrdSectionSchema>;
