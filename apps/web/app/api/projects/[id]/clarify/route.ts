export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, projects, questionHistory, eq, and, asc, type QuestionHistoryInsert } from '@repo/db'
import { ClarifyAiResponseSchema } from '@repo/contracts/ai/clarify-stream'
import { ClarifyPostBodySchema } from '@repo/contracts/questions/history'
import {
  checkCreditsForApi as checkCredits,
  deductCreditsForApi as deductCredits,
  type ApiCreditOperationType as OperationType,
} from '@infrastructure/http/credits-http-bridge'
import { callAI, createBufferedStreamingResponse } from '@/lib/ai-service'
import {
  buildClarifyMessages,
  buildClarifyMessagesFromClientThread,
  normalizePrdSection,
  type ClientThreadMessage,
} from '@/lib/clarify-prompt'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userResult = await requireUser(await headers())
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = userResult.unwrap().id

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, params.id), eq(projects.userId, userId)))
      .limit(1)

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const rawBody = await request.json().catch(() => ({}))
    const bodyParsed = ClarifyPostBodySchema.safeParse(rawBody ?? {})
    if (!bodyParsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: bodyParsed.error.flatten() }, { status: 400 })
    }
    const { message, decisionResponse, prdVersionId, clientThread, refinementContextLabel } =
      bodyParsed.data
    const prdVersionIdResolved = prdVersionId === undefined ? null : prdVersionId
    const threadOverride = Array.isArray(clientThread) ? (clientThread as ClientThreadMessage[]) : null

    const decisionType =
      typeof decisionResponse === 'object' &&
      decisionResponse !== null &&
      'type' in decisionResponse &&
      typeof (decisionResponse as { type: unknown }).type === 'string'
        ? (decisionResponse as { type: string }).type
        : undefined

    let opType: OperationType = 'clarification'
    if (decisionType === 'mini_form' || decisionType === 'modal_form') {
      opType = 'mini_form'
    } else if (decisionResponse !== undefined) {
      opType = 'decision'
    }

    const creditCheck = await checkCredits(userId, opType)
    if (!creditCheck.allowed) {
      return NextResponse.json(
        {
          error: 'insufficient_credits',
          message: creditCheck.reason,
          balance: creditCheck.currentBalance,
          cost: creditCheck.cost,
        },
        { status: 402 }
      )
    }

    const history = await db
      .select()
      .from(questionHistory)
      .where(eq(questionHistory.projectId, params.id))
      .orderBy(asc(questionHistory.createdAt))
      .limit(20)

    let userMessage = ''
    if (decisionResponse) {
      userMessage = `Decision: ${JSON.stringify(decisionResponse)}${message ? ` | Comment: ${message}` : ''}`
    } else if (message) {
      userMessage = message
    } else {
      userMessage =
        'Start clarification. Ask one high-value question for the first uncovered PRD section.'
    }

    const messages =
      threadOverride != null && threadOverride.length > 0
        ? buildClarifyMessagesFromClientThread(
            { name: project.name, description: project.description },
            threadOverride,
            userMessage,
            refinementContextLabel
          )
        : buildClarifyMessages(
            { name: project.name, description: project.description },
            (history ?? []).map((q) => ({
              structuredQuestion: q.structuredQuestion,
              founderAnswer: q.founderAnswer,
              prdImpact: q.prdImpact,
            })),
            userMessage
          )

    const aiResponse = await callAI({
      messages,
      stream: true,
      maxTokens: 900,
      temperature: 0.5,
      responseFormat: { type: 'json_object' },
    })

    const founderAnswer = message ?? (decisionResponse ? JSON.stringify(decisionResponse) : null)

    const persistAfterValidStream = async (result: string) => {
      try {
        const raw = JSON.parse(result)
        const validated = ClarifyAiResponseSchema.safeParse(raw)
        if (!validated.success) {
          console.error('Clarify: stream schema validation failed', validated.error.flatten())
          return
        }
        const ai = validated.data
        try {
          await deductCredits(userId, opType, { projectId: params.id, prdVersionId: prdVersionIdResolved ?? undefined })
        } catch (e: unknown) {
          console.error('Clarify: credit deduction failed after validated AI response', e)
          return
        }
        const qhInsert: QuestionHistoryInsert = {
          projectId: params.id,
          prdVersionId: prdVersionIdResolved,
          structuredQuestion: ai.message,
          availableOptions: ai.decision_ui,
          founderAnswer,
          aiInterpretation: ai.reasoning,
          prdImpact: normalizePrdSection(ai.prd_section_affected) ?? ai.prd_section_affected,
          questionType: ai.suggested_credit_type,
        }
        await db.insert(questionHistory).values(qhInsert)
      } catch (e: unknown) {
        console.error('Clarify: failed to persist question history', e)
      }
    }

    const stream = createBufferedStreamingResponse(aiResponse, persistAfterValidStream)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error: unknown) {
    console.error('Clarify error:', error)
    const msg = error instanceof Error ? error.message : 'Clarification failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
