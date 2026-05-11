export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, milestoneFeedback, eq, and, desc, type MilestoneFeedbackInsert } from '@repo/db'
import { MilestoneFeedbackPostBodySchema } from '@repo/contracts/feedback/milestone'

export async function POST(request: NextRequest) {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const raw = await request.json()
    const parsed = MilestoneFeedbackPostBodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }
    const { projectId, prdVersionId, milestoneType, ratingType, ratingValue, comment } = parsed.data

    const [existing] = await db
      .select({ id: milestoneFeedback.id })
      .from(milestoneFeedback)
      .where(
        and(
          eq(milestoneFeedback.userId, userId),
          eq(milestoneFeedback.projectId, projectId),
          eq(milestoneFeedback.milestoneType, milestoneType),
          ...(prdVersionId ? [eq(milestoneFeedback.prdVersionId, prdVersionId)] : [])
        )
      )
      .limit(1)

    if (existing) {
      return NextResponse.json({ message: 'Feedback already submitted' })
    }

    const fbInsert: MilestoneFeedbackInsert = {
      userId,
      projectId,
      prdVersionId: prdVersionId ?? null,
      milestoneType,
      ratingType: ratingType ?? 'stars',
      ratingValue: ratingValue ?? null,
      comment: comment ?? null,
    }
    const [feedback] = await db
      .insert(milestoneFeedback)
      .values(fbInsert)
      .returning()

    return NextResponse.json(feedback, { status: 201 })
  } catch (error: any) {
    console.error('Feedback POST error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const feedback = await db
      .select()
      .from(milestoneFeedback)
      .where(eq(milestoneFeedback.userId, userId))
      .orderBy(desc(milestoneFeedback.createdAt))

    return NextResponse.json(feedback)
  } catch (error: any) {
    console.error('Feedback GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
