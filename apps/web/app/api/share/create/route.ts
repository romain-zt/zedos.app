export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const body = await request.json()
    const { prdVersionId } = body ?? {}

    if (!prdVersionId) {
      return NextResponse.json({ error: 'PRD version ID is required' }, { status: 400 })
    }

    // Verify ownership
    const prdVersion = await prisma.prdVersion.findFirst({
      where: { id: prdVersionId },
      include: { project: { select: { userId: true } } },
    })
    if (!prdVersion || prdVersion.project?.userId !== userId) {
      return NextResponse.json({ error: 'PRD version not found' }, { status: 404 })
    }

    // Check for existing active link
    const existing = await prisma.shareLink.findFirst({
      where: { prdVersionId, enabled: true },
    })
    if (existing) {
      return NextResponse.json(existing)
    }

    const token = crypto.randomBytes(16).toString('hex')
    const shareLink = await prisma.shareLink.create({
      data: { prdVersionId, token },
    })

    return NextResponse.json(shareLink, { status: 201 })
  } catch (error: any) {
    console.error('Share create error:', error)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}
