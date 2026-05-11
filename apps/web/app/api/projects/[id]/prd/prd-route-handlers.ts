import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { PrismaPrdRepository } from '@infrastructure/persistence/prd-repository'
import { GetPrdVersionsUseCase } from '@application/prd/get-prd-versions-usecase'
import { EnsureFirstPrdVersionUseCase } from '@application/prd/ensure-first-prd-version-usecase'
import {
  CreateOrCapturePrdVersionRequestSchema,
  CapturedPrdVersionResponseSchema,
} from '@repo/contracts/prd/prd-contracts'
import { ApplicationError } from '@shared/errors/application-error'

function toErrorResponse(e: ApplicationError) {
  return NextResponse.json({ error: e.message }, { status: e.statusCode })
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  const useCase = new GetPrdVersionsUseCase(new PrismaProjectRepository(), new PrismaPrdRepository())
  const result = await useCase.execute(params.id, userId)
  if (result.isErr()) return toErrorResponse(result.error)
  return NextResponse.json(result.unwrap())
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userResult = await requireUser(headers())
  if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = userResult.unwrap().id

  let raw: unknown = {}
  try {
    raw = await request.json()
  } catch {
    raw = {}
  }
  const parsed = CreateOrCapturePrdVersionRequestSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const useCase = new EnsureFirstPrdVersionUseCase(new PrismaProjectRepository(), new PrismaPrdRepository())
  const result = await useCase.execute(params.id, userId, parsed.data)
  if (result.isErr()) return toErrorResponse(result.error)
  const out = CapturedPrdVersionResponseSchema.safeParse(result.unwrap())
  if (!out.success) return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  return NextResponse.json(out.data)
}
