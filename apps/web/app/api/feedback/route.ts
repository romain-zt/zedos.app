export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, milestoneFeedback, eq, and, desc, type MilestoneFeedbackInsert } from '@repo/db'
import {
  SubmitMilestoneFeedbackRequestSchema,
  MilestoneFeedbackRowSchema,
  MilestoneFeedbackDuplicateResponseSchema,
} from '@repo/contracts/feedback'

export async function POST(request: NextRequest) {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = SubmitMilestoneFeedbackRequestSchema.safeParse(raw)
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
      const dup = { message: 'Feedback already submitted' }
      const v = MilestoneFeedbackDuplicateResponseSchema.safeParse(dup)
      if (!v.success) {
        console.error('Feedback POST: duplicate response shape drift', v.error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
      }
      return NextResponse.json(v.data)
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
    const [feedback] = await db.insert(milestoneFeedback).values(fbInsert).returning()

    const row = MilestoneFeedbackRowSchema.safeParse(feedback)
    if (!row.success) {
      console.error('Feedback POST: row shape drift', row.error)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }

    return NextResponse.json(row.data, { status: 201 })
  } catch (error: unknown) {
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
  } catch (error: unknown) {
    console.error('Feedback GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
