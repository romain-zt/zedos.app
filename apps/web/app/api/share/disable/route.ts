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
    const { shareLinkId } = body ?? {}

    if (!shareLinkId) {
      return NextResponse.json({ error: 'Share link ID is required' }, { status: 400 })
    }

    const shareLink = await prisma.shareLink.findUnique({
      where: { id: shareLinkId },
      include: { prdVersion: { include: { project: { select: { userId: true } } } } },
    })

    if (!shareLink || shareLink.prdVersion?.project?.userId !== userId) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
    }

    const updated = await prisma.shareLink.update({
      where: { id: shareLinkId },
      data: { enabled: false, disabledAt: new Date() },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Share disable error:', error)
    return NextResponse.json({ error: 'Failed to disable share link' }, { status: 500 })
  }
}
