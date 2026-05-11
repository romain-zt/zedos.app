export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, projects, questionHistory, eq, and, asc } from '@repo/db'

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

    const questions = await db
      .select()
      .from(questionHistory)
      .where(eq(questionHistory.projectId, params.id))
      .orderBy(asc(questionHistory.createdAt))

    return NextResponse.json(questions)
  } catch (error: any) {
    console.error('Questions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}
