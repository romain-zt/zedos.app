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
import {
  AiServiceError,
  aiServiceErrorToHttpPayload,
  callAI,
  createBufferedStreamingResponse,
} from '@/lib/ai-service'
import {
  buildClarifyMessages,
  buildClarifyMessagesFromClientThread,
  normalizePrdSection,
  type ClientThreadMessage,
} from '@/lib/clarify-prompt'
import { createLogger } from '@shared/observability/logger'
import { validationFailureData } from '@shared/observability/log-safe'

const logger = createLogger({ operation: 'clarify' })

function resolveResponseLanguage(requestHeaders: Headers): 'fr' | 'en' {
  const cookie = requestHeaders.get('cookie') ?? ''
  const localeCookie = cookie.match(/(?:^|;\s*)zedos_locale=(fr|en)(?:;|$)/)?.[1]
  if (localeCookie === 'fr' || localeCookie === 'en') {
    return localeCookie
  }

  const acceptLanguage = (requestHeaders.get('accept-language') ?? '').toLowerCase()
  return acceptLanguage.includes('fr') ? 'fr' : 'en'
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id
  let userId: string | undefined

  try {
    const requestHeaders = await headers()
    const userResult = await requireUser(requestHeaders)
    if (userResult.isErr()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = userResult.unwrap().id
    const responseLanguage = resolveResponseLanguage(requestHeaders)

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
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
      .where(eq(questionHistory.projectId, projectId))
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
            refinementContextLabel,
            responseLanguage
          )
        : buildClarifyMessages(
            { name: project.name, description: project.description },
            (history ?? []).map((q) => ({
              structuredQuestion: q.structuredQuestion,
              founderAnswer: q.founderAnswer,
              prdImpact: q.prdImpact,
            })),
            userMessage,
            responseLanguage
          )

    const aiResponse = await callAI({
      messages,
      stream: true,
      maxTokens: 900,
      temperature: 0.5,
      responseFormat: { type: 'json_object' },
    })

    const founderAnswer = message ?? (decisionResponse ? JSON.stringify(decisionResponse) : null)

    const routeLogger = logger.withContext({ projectId, userId })

    const persistAfterValidStream = async (result: string) => {
      try {
        const raw = JSON.parse(result)
        const validated = ClarifyAiResponseSchema.safeParse(raw)
        const withDefaultQuestionType = ClarifyAiResponseSchema.safeParse({
          ...raw,
          suggested_credit_type: opType,
        })
        if (!validated.success) {
          if (!withDefaultQuestionType.success) {
            routeLogger.error(
              'Clarify stream schema validation failed',
              validationFailureData(validated.error.flatten())
            )
            return
          }
          routeLogger.warn('Clarify stream missing suggested_credit_type; defaulted from operation')
        }
        const ai = validated.success ? validated.data : withDefaultQuestionType.data
        try {
          await deductCredits(userId, opType, {
            projectId,
            prdVersionId: prdVersionIdResolved ?? undefined,
          })
        } catch (e: unknown) {
          routeLogger.error('Clarify credit deduction failed after validated AI response', e)
          return
        }
        const qhInsert: QuestionHistoryInsert = {
          projectId,
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
        routeLogger.error('Clarify failed to persist question history', e)
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
    logger.withContext({ projectId, userId }).error('Clarify request failed', error)
    if (error instanceof AiServiceError) {
      const mapped = aiServiceErrorToHttpPayload(error)
      return NextResponse.json(mapped.body, { status: mapped.status })
    }
    const msg = error instanceof Error ? error.message : 'Clarification failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
