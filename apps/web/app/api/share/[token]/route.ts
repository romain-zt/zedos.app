export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db, shareLinks, prdVersions, projects, eq } from '@repo/db'

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const [row] = await db
      .select({
        enabled: shareLinks.enabled,
        versionNumber: prdVersions.versionNumber,
        content: prdVersions.content,
        status: prdVersions.status,
        createdAt: prdVersions.createdAt,
        projectName: projects.name,
      })
      .from(shareLinks)
      .innerJoin(prdVersions, eq(shareLinks.prdVersionId, prdVersions.id))
      .innerJoin(projects, eq(prdVersions.projectId, projects.id))
      .where(eq(shareLinks.token, params.token))
      .limit(1)

    if (!row || !row.enabled) {
      return NextResponse.json({ error: 'Share link not found or disabled' }, { status: 404 })
    }

    return NextResponse.json({
      projectName: row.projectName ?? 'Untitled Project',
      versionNumber: row.versionNumber ?? 1,
      content: row.content ?? null,
      status: row.status ?? 'draft',
      createdAt: row.createdAt,
    })
  } catch (error: any) {
    console.error('Share GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch shared PRD' }, { status: 500 })
  }
}
