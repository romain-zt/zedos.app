export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository'
import { DrizzleAdrRepository } from '@infrastructure/persistence/adr-repository'
import { GetAdrUseCase } from '@application/adr/get-adr-usecase'
import { UpdateAdrUseCase } from '@application/adr/update-adr-usecase'

async function resolveUserId(session: any): Promise<string | null> {
  if ((session?.user as any)?.id) return (session.user as any).id
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    return user?.id || null
  }
  return null
}

export async function GET(
  req: Request,
  { params }: { params: { id: string; number: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = await resolveUserId(session)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adrNumber = parseInt(params.number, 10)
  const projectRepo = new DrizzleProjectRepository()
  const adrRepo = new DrizzleAdrRepository()
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
  const session = await getServerSession(authOptions)
  const userId = await resolveUserId(session)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const adrNumber = parseInt(params.number, 10)
  const projectRepo = new DrizzleProjectRepository()
  const adrRepo = new DrizzleAdrRepository()
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
