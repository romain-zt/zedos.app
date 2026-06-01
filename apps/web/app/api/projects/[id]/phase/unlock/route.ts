export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { PrismaPrdRepository } from '@infrastructure/persistence/prd-repository'
import { UnlockPhaseUseCase } from '@application/adr/unlock-phase-usecase'
import { toNextErrorResponse } from '@shared/http'
import { createLogger } from '@shared/observability/logger'

const logger = createLogger({ operation: 'phase/unlock' })

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userResult = await requireUser(headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id
  const routeContext = { projectId: params.id, userId }

  const projectRepo = new PrismaProjectRepository()
  const prdRepo = new PrismaPrdRepository()
  const useCase = new UnlockPhaseUseCase(projectRepo, prdRepo)
  const result = await useCase.execute(params.id, userId)

  if (result.isErr()) {
    logger.warn('Phase unlock failed', { ...routeContext, statusCode: result.error.statusCode })
    return toNextErrorResponse(result.error)
  }
  logger.info('Phase unlocked', routeContext)
  return NextResponse.json(result.unwrap())
}
