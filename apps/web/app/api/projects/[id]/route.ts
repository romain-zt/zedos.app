export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository'
import { db, users, eq } from '@repo/db'
import { GetProjectUseCase } from '@application/project/get-project-usecase'
import { UpdateProjectUseCase } from '@application/project/update-project-usecase'
import { DeleteProjectUseCase } from '@application/project/delete-project-usecase'

function getSessionUserId(session: any): string | null {
  return session?.user?.id || null
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const repo = new DrizzleProjectRepository()
  const useCase = new GetProjectUseCase(repo)
  const result = await useCase.execute(params.id, userId)

  if (result.isErr()) {
    const e = result.error as any
    return NextResponse.json({ error: e.message }, { status: e.statusCode || 404 })
  }
  return NextResponse.json(result.unwrap())
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const repo = new DrizzleProjectRepository()
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
  const session = await getServerSession(authOptions)
  const userId = getSessionUserId(session)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const repo = new DrizzleProjectRepository()
  const useCase = new DeleteProjectUseCase(repo)
  const result = await useCase.execute(params.id, userId)

  if (result.isErr()) {
    const e = result.error as any
    return NextResponse.json({ error: e.message }, { status: e.statusCode || 500 })
  }
  return NextResponse.json({ success: true })
}
