export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

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
