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
import { createLogger } from '@shared/observability/logger'
import { validationFailureData } from '@shared/observability/log-safe'

const logger = createLogger({ operation: 'feedback' })

export async function POST(request: NextRequest) {
  let userId: string | undefined

  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = userResult.unwrap().id

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
        const outcomeComment =
          requestBody.ratingType === 'outcome' && requestBody.outcomeValue
            ? requestBody.outcomeValue
            : null
        const feedbackInsert: MilestoneFeedbackInsert = {
          userId: ownerUserId,
          projectId: requestBody.projectId,
          prdVersionId: requestBody.prdVersionId ?? null,
          milestoneType: requestBody.milestoneType,
          ratingType: requestBody.ratingType ?? 'stars',
          ratingValue: requestBody.ratingValue ?? null,
          comment: requestBody.comment ?? outcomeComment,
        }
        const [feedback] = await db.insert(milestoneFeedback).values(feedbackInsert).returning()
        const dto = MilestoneFeedbackRowDTOSchema.safeParse(feedback)
        if (!dto.success) {
          logger
            .withContext({ userId, projectId: requestBody.projectId })
            .error(
              'Feedback row DTO validation failed',
              validationFailureData(dto.error.flatten())
            )
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
    logger.withContext({ userId }).error('Feedback POST failed', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}

export async function GET() {
  let userId: string | undefined

  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = userResult.unwrap().id

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
      logger
        .withContext({ userId })
        .error('Feedback GET list validation failed', validationFailureData(validated.error.flatten()))
      return NextResponse.json({ error: 'Internal validation error' }, { status: 500 })
    }
    return NextResponse.json(validated.data)
  } catch (error: unknown) {
    logger.withContext({ userId }).error('Feedback GET failed', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
