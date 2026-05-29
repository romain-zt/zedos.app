export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, projects, questionHistory, prdVersions, eq, and, count } from '@repo/db'
import {
  QuestionCoverageReadinessScoreResponseSchema,
  buildReadinessScoreFromQuestionRows,
} from '@repo/contracts/questions/history'
import { createLogger } from '@shared/observability/logger'
import { validationFailureData } from '@shared/observability/log-safe'

const logger = createLogger({ operation: 'readiness-score' })

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const projectId = params.id
  let userId: string | undefined

  try {
    const userResult = await requireUser(await headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = userResult.unwrap().id

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1)

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const qRows = await db
      .select({
        founderAnswer: questionHistory.founderAnswer,
        prdImpact: questionHistory.prdImpact,
      })
      .from(questionHistory)
      .where(eq(questionHistory.projectId, projectId))

    const [prdCountRow] = await db
      .select({ c: count() })
      .from(prdVersions)
      .where(eq(prdVersions.projectId, projectId))

    const hasPrdVersion = (prdCountRow?.c ?? 0) > 0

    const payload = buildReadinessScoreFromQuestionRows(
      qRows.map((r) => ({
        founderAnswer: r.founderAnswer ?? null,
        prdImpact: r.prdImpact ?? null,
      })),
      hasPrdVersion,
    )

    const validated = QuestionCoverageReadinessScoreResponseSchema.safeParse(payload)
    if (!validated.success) {
      logger
        .withContext({ projectId, userId })
        .error(
          'Readiness score outbound validation failed',
          validationFailureData(validated.error.flatten())
        )
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(validated.data)
  } catch (error: unknown) {
    logger.withContext({ projectId, userId }).error('Readiness score GET failed', error)
    return NextResponse.json({ error: 'Failed to compute readiness' }, { status: 500 })
  }
}
