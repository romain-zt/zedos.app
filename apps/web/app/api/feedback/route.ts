export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, milestoneFeedback, eq, and, desc, type MilestoneFeedbackInsert } from '@repo/db'
import {
  MilestoneFeedbackSubmitRequestSchema,
  MilestoneFeedbackRowDTOSchema,
  MilestoneFeedbackDuplicateResponseSchema,
} from '@repo/contracts/feedback/submit'

export async function POST(request: NextRequest) {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const rawBody = await request.json().catch(() => null)
    const parsed = MilestoneFeedbackSubmitRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { projectId, prdVersionId, milestoneType, ratingType, ratingValue, comment } = parsed.data
    const prdVid = prdVersionId ?? null

    const [existing] = await db
      .select({ id: milestoneFeedback.id })
      .from(milestoneFeedback)
      .where(
        and(
          eq(milestoneFeedback.userId, userId),
          eq(milestoneFeedback.projectId, projectId),
          eq(milestoneFeedback.milestoneType, milestoneType),
          ...(prdVid ? [eq(milestoneFeedback.prdVersionId, prdVid)] : [])
        )
      )
      .limit(1)

    if (existing) {
      const dup = MilestoneFeedbackDuplicateResponseSchema.safeParse({
        message: 'Feedback already submitted',
      })
      return NextResponse.json(dup.success ? dup.data : { message: 'Feedback already submitted' })
    }

    const fbInsert: MilestoneFeedbackInsert = {
      userId,
      projectId,
      prdVersionId: prdVid,
      milestoneType,
      ratingType: ratingType ?? 'stars',
      ratingValue: ratingValue ?? null,
      comment: comment ?? null,
    }
    const [feedback] = await db
      .insert(milestoneFeedback)
      .values(fbInsert)
      .returning()

    const dto = MilestoneFeedbackRowDTOSchema.safeParse(feedback)
    if (!dto.success) {
      console.error('Feedback row DTO validation failed:', dto.error.flatten())
      return NextResponse.json({ error: 'Internal validation error' }, { status: 500 })
    }
    return NextResponse.json(dto.data, { status: 201 })
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

    const rows = await db
      .select()
      .from(milestoneFeedback)
      .where(eq(milestoneFeedback.userId, userId))
      .orderBy(desc(milestoneFeedback.createdAt))

    const dtoList: unknown[] = []
    for (const row of rows) {
      const v = MilestoneFeedbackRowDTOSchema.safeParse(row)
      if (v.success) dtoList.push(v.data)
    }
    const listSchema = MilestoneFeedbackRowDTOSchema.array()
    const validated = listSchema.safeParse(dtoList)
    if (!validated.success) {
      console.error('Feedback GET list validation failed:', validated.error.flatten())
      return NextResponse.json({ error: 'Internal validation error' }, { status: 500 })
    }
    return NextResponse.json(validated.data)
  } catch (error: unknown) {
    console.error('Feedback GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
