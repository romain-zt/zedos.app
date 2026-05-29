export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { generatePrdStreamForProject } from '@infrastructure/prd/generate-prd-stream-flow'

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }
  return fallback
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const flowResult = await generatePrdStreamForProject({ projectId: params.id, userId })
    if (flowResult.ok === false) {
      if (flowResult.status === 402 && flowResult.details) {
        const details = flowResult.details as { message?: string; balance?: number; cost?: number }
        return NextResponse.json(
          {
            error: flowResult.error,
            message: details.message,
            balance: details.balance,
            cost: details.cost,
          },
          { status: flowResult.status }
        )
      }
      return NextResponse.json({ error: flowResult.error }, { status: flowResult.status })
    }

    return new Response(flowResult.stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: unknown) {
    console.error('Generate PRD error:', error)
    return NextResponse.json({ error: errorMessage(error, 'PRD generation failed') }, { status: 500 })
  }
}
