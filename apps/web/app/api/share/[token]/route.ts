export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { token: params.token },
      include: {
        prdVersion: {
          include: {
            project: { select: { name: true } },
          },
        },
      },
    })

    if (!shareLink || !shareLink.enabled) {
      return NextResponse.json({ error: 'Share link not found or disabled' }, { status: 404 })
    }

    return NextResponse.json({
      projectName: shareLink.prdVersion?.project?.name ?? 'Untitled Project',
      versionNumber: shareLink.prdVersion?.versionNumber ?? 1,
      content: shareLink.prdVersion?.content ?? null,
      status: shareLink.prdVersion?.status ?? 'draft',
      createdAt: shareLink.prdVersion?.createdAt,
    })
  } catch (error: any) {
    console.error('Share GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch shared PRD' }, { status: 500 })
  }
}
