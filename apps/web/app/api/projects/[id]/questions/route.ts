export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = (session.user as any).id

    const project = await prisma.project.findFirst({ where: { id: params.id, userId } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const questions = await prisma.questionHistory.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(questions)
  } catch (error: any) {
    console.error('Questions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}
