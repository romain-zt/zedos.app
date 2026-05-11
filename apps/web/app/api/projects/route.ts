export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { prisma } from '@/lib/prisma'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { ListProjectsUseCase } from '@application/project/list-projects-usecase'
import { CreateProjectUseCase } from '@application/project/create-project-usecase'
import { CreateProjectRequestSchema } from '@contracts/project/project-contracts'

export async function GET() {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const repo = new PrismaProjectRepository(prisma)
  const useCase = new ListProjectsUseCase(repo)
  const result = await useCase.execute(userId)

  if (result.isErr()) {
    const e = result.error as any
    return NextResponse.json({ error: e.message }, { status: e.statusCode || 500 })
  }
  return NextResponse.json(result.unwrap())
}

export async function POST(request: NextRequest) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const body = await request.json()
  const parsed = CreateProjectRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Validation error' }, { status: 400 })
  }

  const repo = new PrismaProjectRepository(prisma)
  const useCase = new CreateProjectUseCase(repo)
  const result = await useCase.execute({ userId, name: parsed.data.name, description: parsed.data.description ?? null })

  if (result.isErr()) {
    const e = result.error as any
    return NextResponse.json({ error: e.message }, { status: e.statusCode || 500 })
  }
  return NextResponse.json(result.unwrap(), { status: 201 })
}
