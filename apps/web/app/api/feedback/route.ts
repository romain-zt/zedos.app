export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const body = await request.json()
    const { projectId, prdVersionId, milestoneType, ratingType, ratingValue, comment } = body ?? {}

    if (!projectId || !milestoneType) {
      return NextResponse.json({ error: 'Project ID and milestone type are required' }, { status: 400 })
    }

    // Check if feedback already submitted for this milestone
    const existing = await prisma.milestoneFeedback.findFirst({
      where: {
        userId,
        projectId,
        milestoneType,
        ...(prdVersionId ? { prdVersionId } : {}),
      },
    })
    if (existing) {
      return NextResponse.json({ message: 'Feedback already submitted' })
    }

    const feedback = await prisma.milestoneFeedback.create({
      data: {
        userId,
        projectId,
        prdVersionId: prdVersionId ?? null,
        milestoneType,
        ratingType: ratingType ?? 'stars',
        ratingValue: ratingValue ?? null,
        comment: comment ?? null,
      },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error: any) {
    console.error('Feedback POST error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const feedback = await prisma.milestoneFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(feedback)
  } catch (error: any) {
    console.error('Feedback GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 })
  }
}
