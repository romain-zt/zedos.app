export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, projects, prdVersions, questionHistory, eq, and, desc, sql } from '@repo/db'
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository'
import { UpdateProjectUseCase } from '@application/project/update-project-usecase'
import { DeleteProjectUseCase } from '@application/project/delete-project-usecase'
import { toNextErrorResponse } from '@shared/http'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, params.id), eq(projects.userId, userId)))
    .limit(1)

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const prdVersionRows = await db
    .select()
    .from(prdVersions)
    .where(eq(prdVersions.projectId, params.id))
    .orderBy(desc(prdVersions.versionNumber))

  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(questionHistory)
    .where(eq(questionHistory.projectId, params.id))

  return NextResponse.json({
    ...project,
    prdVersions: prdVersionRows,
    _count: { questionHistory: Number(countRow?.count ?? 0) },
  })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

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
    return toNextErrorResponse(result.error)
  }
  return NextResponse.json(result.unwrap())
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const repo = new DrizzleProjectRepository()
  const useCase = new DeleteProjectUseCase(repo)
  const result = await useCase.execute(params.id, userId)

  if (result.isErr()) {
    return toNextErrorResponse(result.error)
  }
  return NextResponse.json({ success: true })
}
