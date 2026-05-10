export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { checkCredits, deductCredits, reverseCredits, OperationType } from '@/lib/credits'
import { callAI, createBufferedStreamingResponse } from '@/lib/ai-service'
import { randomUUID } from 'crypto'

const SYSTEM_PROMPT = `You are Zedos, an expert product strategist helping solo founders turn vague product ideas into clear, versioned PRDs (Product Requirements Documents).

Your role:
- Guide the founder through structured product clarification
- Ask ONE focused question at a time
- When a product decision benefits from constrained input, generate a contextual decision UI
- Reason out loud about WHY you're asking each question
- Track what's been decided and what remains unclear

Response format: You MUST respond in valid JSON with this structure:
{
  "reasoning": "Brief explanation of why this question matters for the PRD",
  "message": "Your guidance text shown to the founder",
  "decision_ui": null | {
    "type": "single_choice" | "multi_choice" | "ranked" | "modal_form",
    "title": "Decision title",
    "description": "Why this matters",
    "options": [{ "id": "opt1", "label": "Option label", "description": "Brief description" }],
    "allow_custom": true,
    "allow_not_sure": true
  },
  "prd_section_affected": "Which PRD section this decision impacts (e.g., 'Target Users', 'Core Features', 'Scope')",
  "progress_hint": "Brief indication of overall progress (e.g., 'Defining target audience', 'Scoping MVP features')",
  "suggested_credit_type": "clarification" | "decision" | "mini_form"
}

Decision UI guidelines:
- Use "single_choice" for mutually exclusive decisions (radio buttons)
- Use "multi_choice" for selecting multiple applicable options (checkboxes)
- Use "ranked" for prioritization (drag to reorder)
- Use "modal_form" for complex multi-field decisions
- Use null for simple guidance messages or free-form questions
- Always include "allow_not_sure": true so founders can ask differently
- Keep options to 3-6 for clarity

PRD structure you're building toward:
1. Product Vision & Problem Statement
2. Target Users & Personas
3. Core Features (MVP scope)
4. User Journeys
5. Technical Constraints & Preferences
6. Success Metrics
7. Out of Scope / Future Considerations
8. Open Questions & Risks

Important:
- Be concise but insightful
- Show genuine product thinking, not just questionnaire behavior
- Challenge assumptions respectfully when needed
- Adapt question format to the decision context
- If the founder says "not sure", rephrase or offer a different angle

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = (session.user as any).id

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId },
  })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = await request.json()
  const { message, decisionResponse, prdVersionId } = body ?? {}

  let opType: OperationType = 'clarification'
  if (decisionResponse?.type === 'mini_form' || decisionResponse?.type === 'modal_form') {
    opType = 'mini_form'
  } else if (decisionResponse) {
    opType = 'decision'
  }

  const creditCheck = await checkCredits(userId, opType)
  if (!creditCheck.allowed) {
    return NextResponse.json({
      error: 'insufficient_credits',
      message: creditCheck.reason,
      balance: creditCheck.currentBalance,
      cost: creditCheck.cost,
    }, { status: 402 })
  }

  // Server-supplied correlation_id per OQ-4 decision
  const correlationId = `${params.id}--${opType}--${randomUUID()}`

  const history = await prisma.questionHistory.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'asc' },
    take: 20,
  })

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Project: "${project.name}"\nDescription: ${project.description ?? 'Not provided yet'}`,
    },
  ]

  for (const q of (history ?? [])) {
    messages.push({
      role: 'assistant',
      content: JSON.stringify({ message: q.structuredQuestion, decision_ui: q.availableOptions ?? null }),
    })
    if (q.founderAnswer) {
      messages.push({ role: 'user', content: q.founderAnswer })
    }
  }

  let userMessage = ''
  if (decisionResponse) {
    userMessage = `Decision response: ${JSON.stringify(decisionResponse)}${message ? `\nAdditional comment: ${message}` : ''}`
  } else if (message) {
    userMessage = message
  } else {
    userMessage = 'Start the product clarification process. Ask me about my product idea.'
  }
  messages.push({ role: 'user', content: userMessage })

  let aiError: Error | null = null

  try {
    const aiResponse = await callAI({
      messages: messages as any,
      stream: true,
      maxTokens: 2000,
      temperature: 0.7,
      responseFormat: { type: 'json_object' },
    })

    const stream = createBufferedStreamingResponse(aiResponse, async (result: string) => {
      // AI succeeded — deduct after stream completes
      await deductCredits(userId, opType, { projectId: params.id, prdVersionId }, correlationId)

      try {
        const parsed = JSON.parse(result)
        await prisma.questionHistory.create({
          data: {
            projectId: params.id,
            prdVersionId: prdVersionId ?? null,
            structuredQuestion: parsed?.message ?? result,
            availableOptions: parsed?.decision_ui ?? null,
            founderAnswer: message ?? (decisionResponse ? JSON.stringify(decisionResponse) : null),
            aiInterpretation: parsed?.reasoning ?? null,
            prdImpact: parsed?.prd_section_affected ?? null,
            questionType: parsed?.suggested_credit_type ?? 'clarification',
          },
        })
      } catch (e: any) {
        console.error('Failed to save question history:', e)
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
    aiError = e
    // AI failed — attempt compensating reversal (no-op if no deduct happened)
    await reverseCredits(userId, correlationId)
    console.error('Clarify error:', e)
    return NextResponse.json({ error: e?.message ?? 'Clarification failed', correlationId }, { status: 500 })
  }
}
