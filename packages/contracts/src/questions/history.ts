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
