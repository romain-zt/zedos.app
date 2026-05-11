export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { DisableShareLinkRequestSchema, ShareLinkMintResponseSchema } from '@repo/contracts/share'
import { db, shareLinks, prdVersions, projects, eq, sql } from '@repo/db'

export async function POST(request: NextRequest) {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = DisableShareLinkRequestSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 },
      )
    }
    const { shareLinkId } = parsed.data

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

    const out = ShareLinkMintResponseSchema.safeParse(updated)
    if (!out.success) {
      console.error('Share disable outbound validation', out.error.flatten())
      return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }

    return NextResponse.json(out.data)
  } catch (error: unknown) {
    console.error('Share disable error:', error)
    return NextResponse.json({ error: 'Failed to disable share link' }, { status: 500 })
  }
}
