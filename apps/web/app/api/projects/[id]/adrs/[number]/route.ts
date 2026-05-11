export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { PrismaAdrRepository } from '@infrastructure/persistence/adr-repository'
import { GetAdrUseCase } from '@application/adr/get-adr-usecase'
import { UpdateAdrUseCase } from '@application/adr/update-adr-usecase'

export async function GET(
  req: Request,
  { params }: { params: { id: string; number: string } }
) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const adrNumber = parseInt(params.number, 10)
  const projectRepo = new PrismaProjectRepository()
  const adrRepo = new PrismaAdrRepository()
  const useCase = new GetAdrUseCase(projectRepo, adrRepo)
  const result = await useCase.execute(params.id, userId, adrNumber)

  if (result.isErr()) {
    const e = result.error as any
    return NextResponse.json({ error: e.message }, { status: e.statusCode || 500 })
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
    const e = result.error as any
    return NextResponse.json({ error: e.message }, { status: e.statusCode || 500 })
  }
  return NextResponse.json(result.unwrap())
}
