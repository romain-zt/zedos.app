export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { ListProjectsUseCase } from '@application/project/list-projects-usecase'
import { CreateProjectUseCase } from '@application/project/create-project-usecase'
import { CreateProjectRequestSchema } from '@contracts/project/project-contracts'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

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
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

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
