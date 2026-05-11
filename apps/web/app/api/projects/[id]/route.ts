export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth'
import { prisma } from '@/lib/prisma'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { GetProjectUseCase } from '@application/project/get-project-usecase'
import { UpdateProjectUseCase } from '@application/project/update-project-usecase'
import { DeleteProjectUseCase } from '@application/project/delete-project-usecase'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const repo = new PrismaProjectRepository(prisma)

  // Use the full query with includes for backwards compat with frontend
  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
    include: {
      prdVersions: { orderBy: { versionNumber: 'desc' } },
      _count: { select: { questionHistory: true } },
    },
  })

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const body = await request.json()
  const repo = new PrismaProjectRepository(prisma)
  const useCase = new UpdateProjectUseCase(repo)
  const result = await useCase.execute({
    projectId: params.id,
    userId,
    name: body?.name,
    description: body?.description,
  })

  if (result.isErr()) {
    const e = result.error as any
    return NextResponse.json({ error: e.message }, { status: e.statusCode || 500 })
  }
  return NextResponse.json(result.unwrap())
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const repo = new PrismaProjectRepository(prisma)
  const useCase = new DeleteProjectUseCase(repo)
  const result = await useCase.execute(params.id, userId)

  if (result.isErr()) {
    const e = result.error as any
    return NextResponse.json({ error: e.message }, { status: e.statusCode || 500 })
  }
  return NextResponse.json({ success: true })
}
