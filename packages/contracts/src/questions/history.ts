import { z } from 'zod';
import { ClarifyDecisionUiSchema } from '../ai/decision-ui';

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

const PRD_SECTION_SET = new Set<string>(PRD_SECTIONS);

/** HTTP shape for GET /api/projects/:id/readiness-score (question-coverage formula; distinct from ADR readiness). */
export const QuestionCoverageReadinessScoreResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  answered: z.number().int().min(0),
  remaining: z.number().int().min(0),
  coveredSections: z.array(z.string()),
  remainingSections: z.array(z.string()),
});

export type QuestionCoverageReadinessScoreResponse = z.infer<
  typeof QuestionCoverageReadinessScoreResponseSchema
>;

export type QuestionHistoryReadinessRow = {
  founderAnswer: string | null;
  prdImpact: string | null;
};

/** Pure readiness payload from question-history rows + PRD-version gate (plan formula). */
export function buildReadinessScoreFromQuestionRows(
  rows: QuestionHistoryReadinessRow[],
  hasPrdVersion: boolean,
): QuestionCoverageReadinessScoreResponse {
  const answeredCount = rows.filter((r) => r.founderAnswer != null).length;
  const answeredRows = rows.filter((r) => r.founderAnswer != null);
  const covered = new Set<string>();
  for (const r of answeredRows) {
    const impact = r.prdImpact;
    if (impact != null && PRD_SECTION_SET.has(impact)) {
      covered.add(impact);
    }
  }
  const coveredSections = PRD_SECTIONS.filter((s) => covered.has(s));
  const remainingSections = PRD_SECTIONS.filter((s) => !covered.has(s));
  const remainingCount = Math.max(0, PRD_SECTIONS.length - coveredSections.length);
  const denom = answeredCount + remainingCount;
  const rawScore = denom > 0 ? Math.round((answeredCount / denom) * 100) : 0;
  const score = hasPrdVersion ? rawScore : Math.min(rawScore, 95);

  return {
    score,
    answered: answeredCount,
    remaining: remainingCount,
    coveredSections,
    remainingSections,
  };
}

/**
 * First up to `limit` canonical PRD sections not yet referenced by any assistant
 * `prd_section_affected` in loaded chat (plan: Coming up chips).
 */
export function comingUpPrdSectionsFromAssistantParsed(
  assistantPrdSectionsAffected: readonly (string | null | undefined)[],
  limit = 3,
): string[] {
  const touched = new Set<string>();
  for (const s of assistantPrdSectionsAffected) {
    if (s != null && PRD_SECTION_SET.has(s)) touched.add(s);
  }
  return PRD_SECTIONS.filter((section) => !touched.has(section)).slice(0, limit);
}

/** In-panel thread override (refine sheet / edit & regenerate) — skips DB history for the prompt. */
export const ClarifyClientThreadMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  reasoning: z.string().optional(),
});

export type ClarifyClientThreadMessage = z.infer<typeof ClarifyClientThreadMessageSchema>;

export const ClarifyPostBodySchema = z
  .object({
    message: z.string().nullish(),
    decisionResponse: z.unknown().nullish(),
    prdVersionId: z.union([z.string().min(1), z.null()]).optional(),
    clientThread: z.array(ClarifyClientThreadMessageSchema).optional(),
    refinementContextLabel: z.string().optional(),
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

/** Same shape as question-coverage readiness HTTP DTO; kept as a separate export for call sites that name it “readiness”. */
export const QuestionReadinessScoreResponseSchema = QuestionCoverageReadinessScoreResponseSchema;

export type QuestionReadinessScoreResponse = QuestionCoverageReadinessScoreResponse;

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
    if (PRD_SECTION_SET.has(s)) covered.add(s);
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
