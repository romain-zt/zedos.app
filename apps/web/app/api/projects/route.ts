export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { requireUser } from '@repo/auth/guards'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { ListProjectsUseCase } from '@application/project/list-projects-usecase'
import { CreateProjectUseCase } from '@application/project/create-project-usecase'
import {
  CreateProjectRequestSchema,
  ProjectDTOSchema,
  ProjectListItemDTOSchema,
} from '@contracts/project/project-contracts'

function jsonFromAppError(e: { message: string; statusCode?: number }) {
  return NextResponse.json({ error: e.message }, { status: e.statusCode ?? 500 })
}

export async function GET() {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const repo = new PrismaProjectRepository()
  const useCase = new ListProjectsUseCase(repo)
  const result = await useCase.execute(userId)

  if (result.isErr()) {
    const e = result.error as { message: string; statusCode?: number }
    return jsonFromAppError(e)
  }

  const listValidation = z.array(ProjectListItemDTOSchema).safeParse(result.unwrap())
  if (!listValidation.success) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(listValidation.data)
}

export async function POST(request: NextRequest) {
  const userResult = await requireUser(await headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const body = await request.json()
  const parsed = CreateProjectRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation error' },
      { status: 400 },
    )
  }

  const repo = new PrismaProjectRepository()
  const useCase = new CreateProjectUseCase(repo)
  const result = await useCase.execute({
    userId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
  })

  if (result.isErr()) {
    const e = result.error as { message: string; statusCode?: number }
    return jsonFromAppError(e)
  }

  const dtoValidation = ProjectDTOSchema.safeParse(result.unwrap())
  if (!dtoValidation.success) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  return NextResponse.json(dtoValidation.data, { status: 201 })
}
