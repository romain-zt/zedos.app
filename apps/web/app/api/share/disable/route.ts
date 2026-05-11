export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, shareLinks, prdVersions, projects, eq, sql } from '@repo/db'

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

    // Verify ownership via join: shareLink → prdVersion → project → userId
    const [shareLink] = await db
      .select({ id: shareLinks.id, projectUserId: projects.userId })
      .from(shareLinks)
      .innerJoin(prdVersions, eq(shareLinks.prdVersionId, prdVersions.id))
      .innerJoin(projects, eq(prdVersions.projectId, projects.id))
      .where(eq(shareLinks.id, shareLinkId))
      .limit(1)

    if (!shareLink || shareLink.projectUserId !== userId) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
    }

    await db.execute(sql`UPDATE share_links SET enabled = false, disabled_at = NOW() WHERE id = ${shareLinkId}`)
    const [updated] = await db
      .select()
      .from(shareLinks)
      .where(eq(shareLinks.id, shareLinkId))
      .limit(1)

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Share disable error:', error)
    return NextResponse.json({ error: 'Failed to disable share link' }, { status: 500 })
  }
}
