export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@repo/auth/guards'
import { db, projects, questionHistory, eq, and, asc, type QuestionHistoryInsert } from '@repo/db'
import { ClarifyAiResponseSchema } from '@repo/contracts/ai/clarify-stream'
import { ClarifyPostBodySchema } from '@repo/contracts/questions/history'
import { checkCredits, deductCredits, OperationType } from '@/lib/credits'
import { callAI, createBufferedStreamingResponse, type AIMessage } from '@/lib/ai-service'

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
    const { message, decisionResponse, prdVersionId } = bodyParsed.data
    const prdVersionIdResolved = prdVersionId === undefined ? null : prdVersionId

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

    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Project: "${project.name}"\nDescription: ${project.description ?? 'Not provided yet'}`,
      },
    ]

    for (const q of (history ?? [])) {
      messages.push({
        role: 'assistant',
        content: JSON.stringify({
          message: q.structuredQuestion,
          decision_ui: q.availableOptions ?? null,
        }),
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

    const aiResponse = await callAI({
      messages,
      stream: true,
      maxTokens: 2000,
      temperature: 0.7,
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
        await deductCredits(userId, opType, { projectId: params.id, prdVersionId: prdVersionIdResolved })
        const qhInsert: QuestionHistoryInsert = {
          projectId: params.id,
          prdVersionId: prdVersionIdResolved,
          structuredQuestion: ai.message,
          availableOptions: ai.decision_ui,
          founderAnswer,
          aiInterpretation: ai.reasoning,
          prdImpact: ai.prd_section_affected,
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
