export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { DrizzleProjectRepository } from '@infrastructure/persistence/project-repository'
import { DrizzlePrdRepository } from '@infrastructure/persistence/prd-repository'
import { CheckPhaseUseCase } from '@application/adr/check-phase-usecase'

async function resolveUserId(session: any): Promise<string | null> {
  if ((session?.user as any)?.id) return (session.user as any).id
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    return user?.id || null
  }
  return null
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const userId = await resolveUserId(session)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectRepo = new DrizzleProjectRepository()
  const prdRepo = new DrizzlePrdRepository()
  const useCase = new CheckPhaseUseCase(projectRepo, prdRepo)
  const result = await useCase.execute(params.id, userId)

  if (result.isErr()) {
    const e = result.error as any
    return NextResponse.json({ error: e.message }, { status: e.statusCode || 500 })
  }
  return NextResponse.json(result.unwrap())
}
