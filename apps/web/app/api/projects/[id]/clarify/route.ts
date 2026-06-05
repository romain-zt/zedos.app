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
  reverseCreditsForApi as reverseCredits,
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
  type ClarifyHistoryRow,
  type ClientThreadMessage,
} from '@/lib/clarify-prompt'
import {
  buildExpressClarifyMessages,
  buildExpressClarifyMessagesFromClientThread,
} from '@/lib/express-clarify-prompt'
import { createLogger } from '@shared/observability/logger'
import { validationFailureData } from '@shared/observability/log-safe'
import { AnalyticsEvents, balanceBucketFromCount } from '@infrastructure/analytics/analytics-events'
import {
  captureServer,
  captureServerException,
} from '@infrastructure/analytics/posthog-server'
import { persistDecisionFromQuestionHistoryEntryUseCase } from '@application/decision-graph/persist-decision-from-question-history-usecase'
import { decisionGraphRepository } from '@infrastructure/persistence/decision-graph-repository'

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
  const clarifyStartedAt = Date.now()

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

    const isExpress = project.journeyMode === 'express'

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
      captureServer(AnalyticsEvents.CLARIFY_BLOCKED_INSUFFICIENT_CREDITS, userId, {
        project_id: projectId,
        action: opType,
        balance_bucket: balanceBucketFromCount(creditCheck.currentBalance),
      })
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
      .limit(isExpress ? 12 : 20)

    const historyRows: ClarifyHistoryRow[] = (history ?? []).map((q) => ({
      structuredQuestion: q.structuredQuestion,
      founderAnswer: q.founderAnswer,
      prdImpact: q.prdImpact,
    }))

    let userMessage = ''
    if (decisionResponse) {
      userMessage = `Decision: ${JSON.stringify(decisionResponse)}${message ? ` | Comment: ${message}` : ''}`
    } else if (message) {
      userMessage = message
    } else {
      userMessage = isExpress
        ? 'Start express (minimum IA) clarification. Ask one focused question for the first uncovered minimum section.'
        : 'Start clarification. Ask one high-value question for the first uncovered PRD section.'
    }

    const projectCtx = { name: project.name, description: project.description }

    const messages =
      threadOverride != null && threadOverride.length > 0
        ? isExpress
          ? buildExpressClarifyMessagesFromClientThread(
              projectCtx,
              threadOverride,
              userMessage,
              refinementContextLabel,
              responseLanguage
            )
          : buildClarifyMessagesFromClientThread(
              projectCtx,
              threadOverride,
              userMessage,
              refinementContextLabel,
              responseLanguage
            )
        : isExpress
          ? buildExpressClarifyMessages(projectCtx, historyRows, userMessage, responseLanguage)
          : buildClarifyMessages(projectCtx, historyRows, userMessage, responseLanguage)

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
      let consumptionCorrelationId: string | null = null
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
          const deductResult = await deductCredits(userId, opType, {
            projectId,
            prdVersionId: prdVersionIdResolved ?? undefined,
          })
          if (!deductResult.success) {
            routeLogger.error('Clarify credit deduction failed after validated AI response')
            return
          }
          consumptionCorrelationId = deductResult.correlationId
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
        const [insertedHistory] = await db
          .insert(questionHistory)
          .values(qhInsert)
          .returning({
            id: questionHistory.id,
            projectId: questionHistory.projectId,
            prdVersionId: questionHistory.prdVersionId,
            structuredQuestion: questionHistory.structuredQuestion,
            availableOptions: questionHistory.availableOptions,
            founderAnswer: questionHistory.founderAnswer,
            optionalComment: questionHistory.optionalComment,
            aiInterpretation: questionHistory.aiInterpretation,
            prdImpact: questionHistory.prdImpact,
          })

        if (insertedHistory) {
          const persistDecisionResult = await persistDecisionFromQuestionHistoryEntryUseCase(
            {
              id: insertedHistory.id,
              projectId: insertedHistory.projectId,
              prdVersionId: insertedHistory.prdVersionId ?? null,
              structuredQuestion: insertedHistory.structuredQuestion,
              availableOptions: insertedHistory.availableOptions,
              founderAnswer: insertedHistory.founderAnswer ?? null,
              optionalComment: insertedHistory.optionalComment ?? null,
              aiInterpretation: insertedHistory.aiInterpretation ?? null,
              prdImpact: insertedHistory.prdImpact ?? null,
            },
            decisionGraphRepository,
          )
          if (persistDecisionResult.isErr()) {
            routeLogger.error('Decision persist skipped after clarify', {
              questionHistoryId: insertedHistory.id,
              code: persistDecisionResult.error.code,
            })
          }
        }

        if (userId) {
          captureServer(AnalyticsEvents.CLARIFY_STREAM_COMPLETED, userId, {
            project_id: projectId,
            journey_mode: isExpress ? 'express' : 'standard',
            duration_ms: Date.now() - clarifyStartedAt,
          })
        }
      } catch (e: unknown) {
        routeLogger.error('Clarify failed to persist question history', e)
        if (consumptionCorrelationId) {
          await reverseCredits(userId, consumptionCorrelationId, { projectId })
        }
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
      if (userId) {
        captureServer(AnalyticsEvents.CLARIFY_FAILED, userId, {
          project_id: projectId,
          error_code: 'ai_service_error',
          http_status: mapped.status,
        })
        captureServerException(error, userId, {
          project_id: projectId,
          route: 'api/projects/[id]/clarify',
          error_code: 'ai_service_error',
          http_status: mapped.status,
        })
      }
      return NextResponse.json(mapped.body, { status: mapped.status })
    }
    const normalized = error instanceof Error ? error : new Error('clarify_request_failed')
    if (userId) {
      captureServer(AnalyticsEvents.CLARIFY_FAILED, userId, {
        project_id: projectId,
        error_code: 'clarify_request_failed',
        http_status: 500,
      })
      captureServerException(normalized, userId, {
        project_id: projectId,
        route: 'api/projects/[id]/clarify',
        error_code: 'clarify_request_failed',
        http_status: 500,
      })
    }
    const msg = normalized.message
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
