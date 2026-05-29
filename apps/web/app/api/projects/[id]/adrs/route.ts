export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { PrismaAdrRepository } from '@infrastructure/persistence/adr-repository'
import { ListAdrsUseCase } from '@application/adr/list-adrs-usecase'
import { toNextErrorResponse } from '@shared/http'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const resolvedUserId = userResult.unwrap().id

  const projectRepo = new PrismaProjectRepository()
  const adrRepo = new PrismaAdrRepository()
  const useCase = new ListAdrsUseCase(projectRepo, adrRepo)
  const result = await useCase.execute(params.id, resolvedUserId)

  if (result.isErr()) {
    return toNextErrorResponse(result.error)
  }
  return NextResponse.json(result.unwrap())
}
