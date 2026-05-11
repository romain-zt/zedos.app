export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, projects, questionHistory, prdVersions, eq, and, count } from '@repo/db'
import {
  QuestionCoverageReadinessScoreResponseSchema,
  buildReadinessScoreFromQuestionRows,
} from '@repo/contracts/questions/history'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, params.id), eq(projects.userId, userId)))
      .limit(1)

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const qRows = await db
      .select({
        founderAnswer: questionHistory.founderAnswer,
        prdImpact: questionHistory.prdImpact,
      })
      .from(questionHistory)
      .where(eq(questionHistory.projectId, params.id))

    const [prdCountRow] = await db
      .select({ c: count() })
      .from(prdVersions)
      .where(eq(prdVersions.projectId, params.id))

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
      console.error('Readiness score outbound validation failed:', validated.error.flatten())
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(validated.data)
  } catch (e) {
    console.error('Readiness score GET error:', e)
    return NextResponse.json({ error: 'Failed to compute readiness' }, { status: 500 })
  }
}
