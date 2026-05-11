export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, projects, questionHistory, eq, and, asc } from '@repo/db'
import { QuestionHistoryListResponseSchema } from '@repo/contracts/questions/history'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, params.id), eq(projects.userId, userId)))
      .limit(1)

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const rows = await db
      .select()
      .from(questionHistory)
      .where(eq(questionHistory.projectId, params.id))
      .orderBy(asc(questionHistory.createdAt))

    const payload = rows.map((row) => ({
      id: row.id,
      projectId: row.projectId,
      prdVersionId: row.prdVersionId ?? null,
      structuredQuestion: row.structuredQuestion,
      availableOptions: row.availableOptions,
      founderAnswer: row.founderAnswer ?? null,
      optionalComment: row.optionalComment ?? null,
      aiInterpretation: row.aiInterpretation ?? null,
      prdImpact: row.prdImpact ?? null,
      questionType: row.questionType,
      createdAt: row.createdAt,
    }))

    const validated = QuestionHistoryListResponseSchema.safeParse(payload)
    if (!validated.success) {
      console.error('Question history outbound validation failed:', validated.error.flatten())
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(validated.data)
  } catch (error: any) {
    console.error('Questions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}
