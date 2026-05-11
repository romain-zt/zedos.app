export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, prdVersions, projects, shareLinks, eq, and, type ShareLinkInsert } from '@repo/db'
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

    // Verify ownership via join: prdVersion → project → userId
    const [prdVersion] = await db
      .select({ id: prdVersions.id, projectUserId: projects.userId })
      .from(prdVersions)
      .innerJoin(projects, eq(prdVersions.projectId, projects.id))
      .where(eq(prdVersions.id, prdVersionId))
      .limit(1)

    if (!prdVersion || prdVersion.projectUserId !== userId) {
      return NextResponse.json({ error: 'PRD version not found' }, { status: 404 })
    }

    // Check for existing active link
    const [existing] = await db
      .select()
      .from(shareLinks)
      .where(and(eq(shareLinks.prdVersionId, prdVersionId), eq(shareLinks.enabled, true)))
      .limit(1)

    if (existing) {
      return NextResponse.json(existing)
    }

    const token = crypto.randomBytes(16).toString('hex')
    const slInsert: ShareLinkInsert = { prdVersionId, token }
    const [shareLink] = await db
      .insert(shareLinks)
      .values(slInsert)
      .returning()

    return NextResponse.json(shareLink, { status: 201 })
  } catch (error: any) {
    console.error('Share create error:', error)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}
