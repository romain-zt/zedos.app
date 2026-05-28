export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import {
  db,
  milestoneFeedback,
  projects,
  eq,
  and,
  or,
  isNull,
  desc,
  type MilestoneFeedbackInsert,
} from '@repo/db'
import {
  MilestoneFeedbackSubmitRequestSchema,
  MilestoneFeedbackRowDTOSchema,
  MilestoneFeedbackDuplicateResponseSchema,
} from '@repo/contracts/feedback/submit'
import { err, ok } from '@repo/result'
import { ExternalServiceError } from '@shared/errors/application-error'
import { CaptureMilestoneFeedbackUseCase } from '@/src/application/feedback/capture-milestone-feedback-usecase'

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

    const useCase = new CaptureMilestoneFeedbackUseCase({
      isProjectOwnedByUser: async (projectId: string, ownerUserId: string): Promise<boolean> => {
        const [project] = await db
          .select({ id: projects.id })
          .from(projects)
          .where(and(eq(projects.id, projectId), eq(projects.userId, ownerUserId)))
          .limit(1)
        return !!project
      },
      findDuplicate: async (
        ownerUserId: string,
        projectId: string,
        milestoneType: string,
        prdVersionId: string | null
      ): Promise<boolean> => {
        const [existing] = await db
          .select({ id: milestoneFeedback.id })
          .from(milestoneFeedback)
          .where(
            and(
              eq(milestoneFeedback.userId, ownerUserId),
              eq(milestoneFeedback.projectId, projectId),
              eq(milestoneFeedback.milestoneType, milestoneType),
              prdVersionId
                ? eq(milestoneFeedback.prdVersionId, prdVersionId)
                : or(isNull(milestoneFeedback.prdVersionId), eq(milestoneFeedback.prdVersionId, ''))
            )
          )
          .limit(1)
        return !!existing
      },
      createFeedback: async (
        ownerUserId: string,
        requestBody
      ) => {
        const feedbackInsert: MilestoneFeedbackInsert = {
          userId: ownerUserId,
          projectId: requestBody.projectId,
          prdVersionId: requestBody.prdVersionId ?? null,
          milestoneType: requestBody.milestoneType,
          ratingType: requestBody.ratingType ?? 'stars',
          ratingValue: requestBody.ratingValue ?? null,
          comment: requestBody.comment ?? null,
        }
        const [feedback] = await db.insert(milestoneFeedback).values(feedbackInsert).returning()
        const dto = MilestoneFeedbackRowDTOSchema.safeParse(feedback)
        if (!dto.success) {
          console.error('Feedback row DTO validation failed:', dto.error.flatten())
          return err(new ExternalServiceError('db', 'Internal validation error', 500))
        }
        return ok(dto.data)
      },
    })

    const result = await useCase.execute({ userId, request: parsed.data })
    if (result.isErr()) {
      return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode })
    }

    if (result.value.kind === 'duplicate') {
      const duplicate = MilestoneFeedbackDuplicateResponseSchema.safeParse({
        message: result.value.message,
      })
      return NextResponse.json(
        duplicate.success ? duplicate.data : { message: result.value.message },
        { status: 200 }
      )
    }

    return NextResponse.json(result.value.row, { status: 201 })
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
