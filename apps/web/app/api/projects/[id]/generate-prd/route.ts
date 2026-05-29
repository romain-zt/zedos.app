export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { generatePrdStreamForProject } from '@infrastructure/prd/generate-prd-stream-flow'
import { createLogger } from '@shared/observability/logger'

const logger = createLogger({ operation: 'generate-prd' })

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }
  return fallback
}

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id
  let userId: string | undefined

  try {
    const userResult = await requireUser(headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = userResult.unwrap().id

    const flowResult = await generatePrdStreamForProject({ projectId, userId })
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
    logger.withContext({ projectId, userId }).error('Generate PRD failed', error)
    return NextResponse.json({ error: errorMessage(error, 'PRD generation failed') }, { status: 500 })
  }
}
