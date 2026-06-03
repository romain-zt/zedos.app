import { db, projects, questionHistory, prdVersions, eq, and, asc, desc, type PrdVersionInsert } from '@repo/db'
import { GeneratePrdAiResponseSchema } from '@repo/contracts/ai/generate-prd-stream'
import { parseExpressGeneratePrdAiResponse } from '@repo/contracts/prd'
import type { PrdDeliverableKind } from '@repo/contracts/prd'
import {
  EXPRESS_PRD_SYSTEM_PROMPT,
  STANDARD_PRD_SYSTEM_PROMPT,
} from '@infrastructure/prd/express-prd-prompts'
import {
  checkCreditsForApi as checkCredits,
  deductCreditsForApi as deductCredits,
} from '@infrastructure/http/credits-http-bridge'
import { callAI, createBufferedStreamingResponse } from '@/lib/ai-service'
import { createLogger } from '@shared/observability/logger'
import { AnalyticsEvents, balanceBucketFromCount } from '@infrastructure/analytics/analytics-events'
import { captureServer } from '@infrastructure/analytics/posthog-server'

const logger = createLogger({ operation: 'generate-prd-stream-flow' })

type FlowError = { ok: false; status: number; error: string; details?: unknown }
type FlowSuccess = {
  ok: true
  stream: ReadableStream
}
type GeneratePrdStreamResult = FlowError | FlowSuccess

type GeneratePrdStreamInput = {
  projectId: string
  userId: string
}

export async function generatePrdStreamForProject(
  input: GeneratePrdStreamInput
): Promise<GeneratePrdStreamResult> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, input.projectId), eq(projects.userId, input.userId)))
    .limit(1)

  if (!project) return { ok: false, status: 404, error: 'Project not found' }

  const deliverableKind: PrdDeliverableKind =
    project.journeyMode === 'express' ? 'express' : 'standard'
  const systemPrompt =
    deliverableKind === 'express' ? EXPRESS_PRD_SYSTEM_PROMPT : STANDARD_PRD_SYSTEM_PROMPT

  const creditCheck = await checkCredits(input.userId, 'prd_generation')
  if (!creditCheck.allowed) {
    captureServer(AnalyticsEvents.PRD_GENERATION_BLOCKED_INSUFFICIENT_CREDITS, input.userId, {
      project_id: input.projectId,
      action: 'prd_generation',
      balance_bucket: balanceBucketFromCount(creditCheck.currentBalance),
    })
    return {
      ok: false,
      status: 402,
      error: 'insufficient_credits',
      details: {
        message: creditCheck.reason,
        balance: creditCheck.currentBalance,
        cost: creditCheck.cost,
      },
    }
  }

  const history = await db
    .select()
    .from(questionHistory)
    .where(eq(questionHistory.projectId, input.projectId))
    .orderBy(asc(questionHistory.createdAt))

  const [lastVersion] = await db
    .select({ versionNumber: prdVersions.versionNumber, content: prdVersions.content })
    .from(prdVersions)
    .where(eq(prdVersions.projectId, input.projectId))
    .orderBy(desc(prdVersions.versionNumber))
    .limit(1)

  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1
  const isUpdate = nextVersionNumber > 1

  const clarificationSummary = history
    .map((q) => `Q: ${q.structuredQuestion}\nA: ${q.founderAnswer ?? 'Not answered'}\nImpact: ${q.prdImpact ?? 'General'}`)
    .join('\n\n')

  const journeyNote =
    deliverableKind === 'express'
      ? '\n\nJourney mode: **express** — produce the 12-section express livrable with lean content.'
      : ''

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    {
      role: 'user' as const,
      content: `Project: "${project.name}"\nDescription: ${project.description ?? 'Not provided'}\n\nVersion: ${nextVersionNumber}${isUpdate ? ` (updating from v${nextVersionNumber - 1})` : ' (initial)'}${journeyNote}\n\nClarification History:\n${clarificationSummary || 'No clarifications yet - generate a basic PRD framework based on the project name and description.'}`,
    },
  ]

  if (isUpdate && lastVersion?.content) {
    messages.push({
      role: 'user' as const,
      content: `Previous PRD (v${lastVersion.versionNumber}):\n${JSON.stringify(lastVersion.content)}\n\nUpdate this PRD with the new clarifications while preserving existing decisions.`,
    })
  }

  const aiResponse = await callAI({
    messages,
    stream: true,
    maxTokens: deliverableKind === 'express' ? 8000 : 6000,
    temperature: 0.5,
    responseFormat: { type: 'json_object' },
  })

  const stream = createBufferedStreamingResponse(aiResponse, async (result: string) => {
    try {
      const parsed = JSON.parse(result) as unknown
      const validated =
        deliverableKind === 'express'
          ? parseExpressGeneratePrdAiResponse(parsed)
          : GeneratePrdAiResponseSchema.safeParse(parsed)
      if (!validated.success) {
        logger.error('Generate PRD AI response validation failed', validated.error.flatten())
        return
      }
      await deductCredits(input.userId, 'prd_generation', { projectId: input.projectId })
      const now = new Date()
      const prdInsert: PrdVersionInsert = {
        projectId: input.projectId,
        versionNumber: nextVersionNumber,
        content: validated.data,
        status: 'generated',
        deliverableKind,
        updatedAt: now,
      }
      await db.insert(prdVersions).values(prdInsert)
      captureServer(AnalyticsEvents.PRD_GENERATION_COMPLETED, input.userId, {
        project_id: input.projectId,
        version_number: nextVersionNumber,
        journey_mode: project.journeyMode,
      })
    } catch (error: unknown) {
      logger.error('Failed to save PRD version', error)
    }
  })

  return { ok: true, stream }
}
