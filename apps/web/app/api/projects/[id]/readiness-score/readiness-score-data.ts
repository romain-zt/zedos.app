import { db, projects, questionHistory, prdVersions, eq, and, isNotNull, count } from '@repo/db'
import { computeReadinessScoreDto, type QuestionReadinessScoreResponse } from '@repo/contracts/questions'

export type ReadinessScoreLookupResult =
  | { ok: true; data: QuestionReadinessScoreResponse }
  | { ok: false; error: string; status: number }

export async function fetchProjectReadinessScore(
  projectId: string,
  userId: string
): Promise<ReadinessScoreLookupResult> {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
    .limit(1)

  if (!project) return { ok: false, error: 'Project not found', status: 404 }

  const answeredRows = await db
    .select({ prdImpact: questionHistory.prdImpact })
    .from(questionHistory)
    .where(and(eq(questionHistory.projectId, projectId), isNotNull(questionHistory.founderAnswer)))

  const answeredQuestionCount = answeredRows.length

  const [{ prdRowCount }] = await db
    .select({ prdRowCount: count() })
    .from(prdVersions)
    .where(eq(prdVersions.projectId, projectId))

  const hasPrdVersion = Number(prdRowCount) > 0

  const data = computeReadinessScoreDto({
    answeredQuestionCount,
    answeredPrdImpacts: answeredRows.map((r) => r.prdImpact),
    hasPrdVersion,
  })

  return { ok: true, data }
}
