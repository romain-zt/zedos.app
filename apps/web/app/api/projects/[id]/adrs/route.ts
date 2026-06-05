export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository'
import { DrizzleAdrRepository } from '@infrastructure/persistence/adr-repository'
import { ListAdrsUseCase } from '@application/adr/list-adrs-usecase'
import { toNextErrorResponse } from '@shared/http'
import { createLogger } from '@shared/observability/logger'

const logger = createLogger({ operation: 'adrs' })

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const resolvedUserId = userResult.unwrap().id
  const routeContext = { projectId: params.id, userId: resolvedUserId }

  const projectRepo = new DrizzleProjectRepository()
  const adrRepo = new DrizzleAdrRepository()
  const useCase = new ListAdrsUseCase(projectRepo, adrRepo)
  const result = await useCase.execute(params.id, resolvedUserId)

  if (result.isErr()) {
    logger.warn('List ADRs failed', { ...routeContext, statusCode: result.error.statusCode })
    return toNextErrorResponse(result.error)
  }
  return NextResponse.json(result.unwrap())
}
