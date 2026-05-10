export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { checkCredits, deductCredits, reverseCredits } from '@/lib/credits'
import { callAI, createBufferedStreamingResponse } from '@/lib/ai-service'
import { randomUUID } from 'crypto'

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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
  })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const creditCheck = await checkCredits(userId, 'prd_generation')
  if (!creditCheck.allowed) {
    return NextResponse.json({
      error: 'insufficient_credits',
      message: creditCheck.reason,
      balance: creditCheck.currentBalance,
      cost: creditCheck.cost,
    }, { status: 402 })
  }

  // Server-supplied correlation_id per OQ-4 decision
  const correlationId = `${params.id}--prd_generation--${randomUUID()}`

  const history = await prisma.questionHistory.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'asc' },
  })

  const lastVersion = await prisma.prdVersion.findFirst({
    where: { projectId: params.id },
    orderBy: { versionNumber: 'desc' },
  })
  const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1
  const isUpdate = nextVersionNumber > 1

  const clarificationSummary = (history ?? []).map((q: any) => {
    return `Q: ${q.structuredQuestion}\nA: ${q.founderAnswer ?? 'Not answered'}\nImpact: ${q.prdImpact ?? 'General'}`
  }).join('\n\n')

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

  try {
    const aiResponse = await callAI({
      messages,
      stream: true,
      maxTokens: 6000,
      temperature: 0.5,
      responseFormat: { type: 'json_object' },
    })

    const stream = createBufferedStreamingResponse(aiResponse, async (result: string) => {
      // AI succeeded — deduct after stream completes
      await deductCredits(userId, 'prd_generation', { projectId: params.id }, correlationId)

      try {
        const parsed = JSON.parse(result)
        await prisma.prdVersion.create({
          data: { projectId: params.id, versionNumber: nextVersionNumber, content: parsed, status: 'generated' },
        })
      } catch (e: any) {
        console.error('Failed to save PRD version:', e)
        try {
          await prisma.prdVersion.create({
            data: { projectId: params.id, versionNumber: nextVersionNumber, content: { raw: result }, status: 'generated' },
          })
        } catch {}
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Correlation-Id': correlationId,
      },
    })
  } catch (e: any) {
    // AI failed — attempt compensating reversal (no-op if no deduct happened)
    await reverseCredits(userId, correlationId)
    console.error('Generate PRD error:', e)
    return NextResponse.json({ error: e?.message ?? 'PRD generation failed', correlationId }, { status: 500 })
  }
}
