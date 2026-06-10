import { z } from 'zod';

/**
 * Human edit of one PRD section. Applying the patch creates a NEW immutable
 * PRD version (status `edited`) — history is never rewritten.
 */
export const UpdatePrdSectionRequestSchema = z.object({
  sectionId: z.string().min(1),
  content: z.string().min(1).max(50_000),
  title: z.string().min(1).max(500).optional(),
});

export type UpdatePrdSectionRequest = z.infer<typeof UpdatePrdSectionRequestSchema>;
