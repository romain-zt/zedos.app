export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { PrismaProjectRepository } from '@infrastructure/persistence/project-repository'
import { PrismaAdrRepository } from '@infrastructure/persistence/adr-repository'
import { ListAdrsUseCase } from '@application/adr/list-adrs-usecase'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id || ''

  // Fallback: use email-based lookup if id not in session
  let resolvedUserId = userId
  if (!resolvedUserId && session.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    resolvedUserId = user.id
  }

  const projectRepo = new PrismaProjectRepository(prisma)
  const adrRepo = new PrismaAdrRepository(prisma)
  const useCase = new ListAdrsUseCase(projectRepo, adrRepo)
  const result = await useCase.execute(params.id, resolvedUserId)

  if (result.isErr()) {
    const e = result.error as any
    return NextResponse.json({ error: e.message }, { status: e.statusCode || 500 })
  }
  return NextResponse.json(result.unwrap())
}
