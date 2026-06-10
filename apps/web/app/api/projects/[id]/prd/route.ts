export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository'
import { DrizzlePrdRepository } from '@infrastructure/persistence/prd-repository'
import { GetPrdVersionsUseCase } from '@application/prd/get-prd-versions-usecase'
import { EnsureFirstPrdVersionUseCase } from '@application/prd/ensure-first-prd-version-usecase'
import {
  CreateOrCapturePrdVersionRequestSchema,
  CapturedPrdVersionResponseSchema,
  PrdVersionListResponseSchema,
} from '@repo/contracts/prd/prd-contracts'
import { UpdatePrdSectionRequestSchema } from '@repo/contracts/prd'
import { UpdatePrdContentUseCase } from '@application/prd/update-prd-content-usecase'
import { agentActivityRepository } from '@infrastructure/persistence/agent-activity-repository'
import { ApplicationError } from '@shared/errors/application-error'
import { createLogger } from '@shared/observability/logger'
import { validationFailureData } from '@shared/observability/log-safe'

const logger = createLogger({ operation: 'prd' })

function toErrorResponse(
  e: ApplicationError,
  context: { projectId: string; userId: string },
  message: string
) {
  logger.warn(message, { ...context, statusCode: e.statusCode })
  return NextResponse.json({ error: e.message }, { status: e.statusCode })
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id
  const routeContext = { projectId: params.id, userId }

  const useCase = new GetPrdVersionsUseCase(new DrizzleProjectRepository(), new DrizzlePrdRepository())
  const result = await useCase.execute(params.id, userId)
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'PRD versions GET failed')
  const out = PrdVersionListResponseSchema.safeParse(result.unwrap())
  if (!out.success) {
    logger
      .withContext(routeContext)
      .error('PRD versions GET outbound validation failed', validationFailureData(out.error.flatten()))
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
  return NextResponse.json(out.data)
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id
  const routeContext = { projectId: params.id, userId }

  let raw: unknown = {}
  try {
    raw = await request.json()
  } catch {
    raw = {}
  }
  const parsed = CreateOrCapturePrdVersionRequestSchema.safeParse(raw)
  if (!parsed.success) {
    logger.warn('PRD version POST validation failed', validationFailureData(parsed.error.flatten()))
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const useCase = new EnsureFirstPrdVersionUseCase(new DrizzleProjectRepository(), new DrizzlePrdRepository())
  const result = await useCase.execute(params.id, userId, parsed.data)
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'PRD version POST failed')
  const out = CapturedPrdVersionResponseSchema.safeParse(result.unwrap())
  if (!out.success) {
    logger
      .withContext(routeContext)
      .error('PRD version POST outbound validation failed', validationFailureData(out.error.flatten()))
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
  logger.info('PRD version captured', routeContext)
  return NextResponse.json(out.data)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id
  const routeContext = { projectId: params.id, userId }

  const parsed = UpdatePrdSectionRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const useCase = new UpdatePrdContentUseCase(
    new DrizzleProjectRepository(),
    new DrizzlePrdRepository(),
    agentActivityRepository
  )
  const result = await useCase.execute({ projectId: params.id, userId, patch: parsed.data })
  if (result.isErr()) return toErrorResponse(result.error, routeContext, 'PRD section PATCH failed')

  const version = result.unwrap()
  logger.info('PRD section edited', { ...routeContext, versionNumber: version.versionNumber })
  return NextResponse.json({
    version: {
      id: version.id,
      versionNumber: version.versionNumber,
      status: version.status,
    },
  })
}
