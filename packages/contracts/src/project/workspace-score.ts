import { z } from 'zod';
import { ReadinessScoreResponseSchema } from '../adr/adr-contracts';
import { QuestionCoverageReadinessScoreResponseSchema } from '../questions/history';

export const WorkspaceScoreResponseSchema = z.object({
  clarification: QuestionCoverageReadinessScoreResponseSchema,
  architecture: ReadinessScoreResponseSchema,
});

export type WorkspaceScoreResponse = z.infer<typeof WorkspaceScoreResponseSchema>;
