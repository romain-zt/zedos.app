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

/** Canonical PRD sections for clarification coverage / readiness score */
export const PRD_SECTIONS = [
  'Product Vision',
  'Target Users',
  'Core Features',
  'User Journeys',
  'Technical Constraints',
  'Success Metrics',
  'Out of Scope',
  'Open Questions',
] as const satisfies readonly string[];

export type PrdSection = (typeof PRD_SECTIONS)[number];

export const QuestionReadinessScoreResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  answered: z.number().int().min(0),
  remaining: z.number().int().min(0),
  coveredSections: z.array(z.string()),
  remainingSections: z.array(z.string()),
});

export type QuestionReadinessScoreResponse = z.infer<typeof QuestionReadinessScoreResponseSchema>;

const canonicalSectionSet = new Set<string>(PRD_SECTIONS as unknown as string[]);

/**
 * Pure readiness DTO from answered question counts and distinct canonical `prdImpact` coverage.
 * Matches slice formula: answered / (answered + remaining_sections) × 100, capped at 95 until a PRD version exists.
 */
export function computeReadinessScoreDto(input: {
  answeredQuestionCount: number;
  answeredPrdImpacts: readonly (string | null | undefined)[];
  hasPrdVersion: boolean;
}): QuestionReadinessScoreResponse {
  const answered = Math.max(0, Math.floor(input.answeredQuestionCount));
  const covered = new Set<string>();
  for (const raw of input.answeredPrdImpacts) {
    if (raw == null) continue;
    const s = String(raw).trim();
    if (canonicalSectionSet.has(s)) covered.add(s);
  }

  const coveredSections = PRD_SECTIONS.filter((s) => covered.has(s));
  const remainingSections = PRD_SECTIONS.filter((s) => !covered.has(s));
  const remaining = remainingSections.length;

  const denominator = answered + remaining;
  const rawScore = denominator > 0 ? Math.round((answered / denominator) * 100) : 0;
  const score = input.hasPrdVersion ? rawScore : Math.min(rawScore, 95);

  return {
    score,
    answered,
    remaining,
    coveredSections: [...coveredSections],
    remainingSections: [...remainingSections],
  };
}
