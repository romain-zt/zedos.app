export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository'
import { UpdateProjectJourneyModeUseCase } from '@application/project/update-project-journey-mode-usecase'
import {
  ProjectDTOSchema,
  UpdateProjectJourneyModeRequestSchema,
} from '@contracts/project/project-contracts'
import { toNextErrorResponse } from '@shared/http'
import { createLogger } from '@shared/observability/logger'
import { validationFailureData } from '@shared/observability/log-safe'

const logger = createLogger({ operation: 'project-journey-mode' })

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id
  const projectId = params.id

  const body: unknown = await request.json()
  const parsed = UpdateProjectJourneyModeRequestSchema.safeParse(body)
  if (!parsed.success) {
    logger.warn('Journey mode validation failed', validationFailureData(parsed.error.flatten()))
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation error' },
      { status: 400 }
    )
  }

  const repo = new DrizzleProjectRepository()
  const useCase = new UpdateProjectJourneyModeUseCase(repo)
  const result = await useCase.execute({
    projectId,
    userId,
    journeyMode: parsed.data.journeyMode,
  })

  if (result.isErr()) {
    logger.warn('Journey mode PATCH failed', { projectId, userId, statusCode: result.error.statusCode })
    return toNextErrorResponse(result.error)
  }

  const dtoValidation = ProjectDTOSchema.safeParse(result.unwrap())
  if (!dtoValidation.success) {
    logger
      .withContext({ projectId, userId })
      .error('Journey mode outbound validation failed', validationFailureData(dtoValidation.error.flatten()))
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  logger.info('Project journey mode updated', { projectId, userId, journeyMode: dtoValidation.data.journeyMode })
  return NextResponse.json(dtoValidation.data)
}
