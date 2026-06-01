export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, projects, prdVersions, questionHistory, eq, and, desc, sql } from '@repo/db'
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository'
import { UpdateProjectUseCase } from '@application/project/update-project-usecase'
import { DeleteProjectUseCase } from '@application/project/delete-project-usecase'
import { toNextErrorResponse } from '@shared/http'
import { createLogger } from '@shared/observability/logger'

const logger = createLogger({ operation: 'project' })

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id
  let userId: string | undefined

  try {
    const userResult = await requireUser(await headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = userResult.unwrap().id

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1)

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const prdVersionRows = await db
      .select()
      .from(prdVersions)
      .where(eq(prdVersions.projectId, projectId))
      .orderBy(desc(prdVersions.versionNumber))

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questionHistory)
      .where(eq(questionHistory.projectId, projectId))

    return NextResponse.json({
      ...project,
      prdVersions: prdVersionRows,
      _count: { questionHistory: Number(countRow?.count ?? 0) },
    })
  } catch (error: unknown) {
    logger.withContext({ projectId, userId }).error('Project GET failed', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id
  const routeContext = { projectId: params.id, userId }

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
    logger.warn('Project PATCH failed', { ...routeContext, statusCode: result.error.statusCode })
    return toNextErrorResponse(result.error)
  }
  logger.info('Project updated', routeContext)
  return NextResponse.json(result.unwrap())
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id
  const routeContext = { projectId: params.id, userId }

  const repo = new DrizzleProjectRepository()
  const useCase = new DeleteProjectUseCase(repo)
  const result = await useCase.execute(params.id, userId)

  if (result.isErr()) {
    logger.warn('Project DELETE failed', { ...routeContext, statusCode: result.error.statusCode })
    return toNextErrorResponse(result.error)
  }
  logger.info('Project deleted', routeContext)
  return NextResponse.json({ success: true })
}
