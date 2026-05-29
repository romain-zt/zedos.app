export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { PrismaPrdRepository } from '@infrastructure/persistence/prd-repository'
import { CheckPhaseUseCase } from '@application/adr/check-phase-usecase'
import { toNextErrorResponse } from '@shared/http'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userResult = await requireUser(headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const projectRepo = new PrismaProjectRepository()
  const prdRepo = new PrismaPrdRepository()
  const useCase = new CheckPhaseUseCase(projectRepo, prdRepo)
  const result = await useCase.execute(params.id, userId)

  if (result.isErr()) {
    return toNextErrorResponse(result.error)
  }
  return NextResponse.json(result.unwrap())
}
