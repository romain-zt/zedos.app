export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { PrismaAdrRepository } from '@infrastructure/persistence/adr-repository'
import { GetAdrUseCase } from '@application/adr/get-adr-usecase'
import { UpdateAdrUseCase } from '@application/adr/update-adr-usecase'
import { toNextErrorResponse } from '@shared/http'
import { createLogger } from '@shared/observability/logger'

const logger = createLogger({ operation: 'adr' })

export async function GET(
  req: Request,
  { params }: { params: { id: string; number: string } }
) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id
  const routeContext = { projectId: params.id, userId, adrNumber: params.number }

  const adrNumber = parseInt(params.number, 10)
  const projectRepo = new PrismaProjectRepository()
  const adrRepo = new PrismaAdrRepository()
  const useCase = new GetAdrUseCase(projectRepo, adrRepo)
  const result = await useCase.execute(params.id, userId, adrNumber)

  if (result.isErr()) {
    logger.warn('ADR GET failed', { ...routeContext, statusCode: result.error.statusCode })
    return toNextErrorResponse(result.error)
  }
  return NextResponse.json(result.unwrap())
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; number: string } }
) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id
  const routeContext = { projectId: params.id, userId, adrNumber: params.number }

  const body = await req.json()
  const adrNumber = parseInt(params.number, 10)
  const projectRepo = new PrismaProjectRepository()
  const adrRepo = new PrismaAdrRepository()
  const useCase = new UpdateAdrUseCase(projectRepo, adrRepo)
  const result = await useCase.execute({
    projectId: params.id,
    userId,
    adrNumber,
    title: body.title,
    content: body.content,
    status: body.status,
  })

  if (result.isErr()) {
    logger.warn('ADR PATCH failed', { ...routeContext, statusCode: result.error.statusCode })
    return toNextErrorResponse(result.error)
  }
  logger.info('ADR updated', routeContext)
  return NextResponse.json(result.unwrap())
}
