import { db, projects, questionHistory, prdVersions, eq, and, asc, desc, type PrdVersionInsert } from '@repo/db'
import { GeneratePrdAiResponseSchema } from '@repo/contracts/ai/generate-prd-stream'
import {
  checkCreditsForApi as checkCredits,
  deductCreditsForApi as deductCredits,
} from '@infrastructure/http/credits-http-bridge'
import { callAI, createBufferedStreamingResponse } from '@/lib/ai-service'
import { createLogger } from '@shared/observability/logger'

const logger = createLogger({ operation: 'generate-prd-stream-flow' })

const PRD_SYSTEM_PROMPT = `You are Zedos, generating a structured PRD from the founder's clarification history.

Generate a comprehensive PRD in JSON format with this structure:
{
  "title": "Product name / PRD title",
  "version_summary": "Brief summary of what's captured in this version",
  "sections": [
    {
      "id": "vision",
      "title": "Product Vision & Problem Statement",
      "content": "Detailed content...",
      "confidence": "high" | "medium" | "low",
      "open_questions": ["Any remaining questions for this section"]
    },
    {
      "id": "target_users",
      "title": "Target Users & Personas",
      "content": "...",
      "confidence": "high" | "medium" | "low",
      "open_questions": []
    },
    {
      "id": "core_features",
      "title": "Core Features (MVP Scope)",
      "content": "...",
      "confidence": "high" | "medium" | "low",
      "open_questions": []
    },
    {
      "id": "user_journeys",
      "title": "User Journeys",
      "content": "...",
      "confidence": "high" | "medium" | "low",
      "open_questions": []
    },
    {
      "id": "technical",
      "title": "Technical Constraints & Preferences",
      "content": "...",
      "confidence": "high" | "medium" | "low",
      "open_questions": []
    },
    {
      "id": "success_metrics",
      "title": "Success Metrics",
      "content": "...",
      "confidence": "high" | "medium" | "low",
      "open_questions": []
    },
    {
      "id": "out_of_scope",
      "title": "Out of Scope / Future Considerations",
      "content": "...",
      "confidence": "high" | "medium" | "low",
      "open_questions": []
    },
    {
      "id": "risks",
      "title": "Open Questions & Risks",
      "content": "...",
      "confidence": "high" | "medium" | "low",
      "open_questions": []
    }
  ]
}

Rules:
- Fill in as much detail as possible from the clarification history
- Mark confidence level for each section based on how much was discussed
- List open questions where clarification is still needed
- Be specific and actionable, not generic
- Use the founder's own language and decisions

Respond with raw JSON only. No markdown, no code blocks.`

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

  const creditCheck = await checkCredits(input.userId, 'prd_generation')
  if (!creditCheck.allowed) {
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

  const messages = [
    { role: 'system' as const, content: PRD_SYSTEM_PROMPT },
    {
      role: 'user' as const,
      content: `Project: "${project.name}"\nDescription: ${project.description ?? 'Not provided'}\n\nVersion: ${nextVersionNumber}${isUpdate ? ` (updating from v${nextVersionNumber - 1})` : ' (initial)'}\n\nClarification History:\n${clarificationSummary || 'No clarifications yet - generate a basic PRD framework based on the project name and description.'}`,
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
    maxTokens: 6000,
    temperature: 0.5,
    responseFormat: { type: 'json_object' },
  })

  const stream = createBufferedStreamingResponse(aiResponse, async (result: string) => {
    try {
      const parsed = JSON.parse(result) as unknown
      const validated = GeneratePrdAiResponseSchema.safeParse(parsed)
      if (!validated.success) {
        logger.error('Generate PRD AI response validation failed', validated.error.flatten())
        return
      }
      await deductCredits(input.userId, 'prd_generation', { projectId: input.projectId })
      const prdInsert: PrdVersionInsert = {
        projectId: input.projectId,
        versionNumber: nextVersionNumber,
        content: validated.data,
        status: 'generated',
      }
      await db.insert(prdVersions).values(prdInsert)
    } catch (error: unknown) {
      logger.error('Failed to save PRD version', error)
    }
  })

  return { ok: true, stream }
}
