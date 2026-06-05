/**
 * AI adapter producing red-team findings from a PRD version.
 *
 * Uses the same `callAI` gateway as the rest of the AI surface. Prompt avoids
 * legal/financial-advice phrasing per scope slice constraint.
 *
 * Output is constrained by `RedTeamGeneratorOutputSchema` (max 50 findings) so we
 * don't blow the panel up. AI returns JSON; we parse, validate, and trim.
 */

import { Result, ok, err } from '@repo/result';
import { ApplicationError, ExternalServiceError } from '@shared/errors/application-error';
import type { IRedTeamGenerator, RedTeamGeneratorInput } from '@domain/red-team/red-team-generator-port';
import type { RedTeamFindingDraft } from '@domain/red-team/red-team-report';
import { RedTeamGeneratorOutputSchema } from '@repo/contracts/ai';
import { callAI, AiServiceError } from '@/lib/ai-service';
import { isE2eMode } from '@shared/testing/e2e-mode';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'RedTeamReportGeneratorAdapter' });

const SYSTEM_PROMPT = `You are an adversarial reviewer (red-team) for a startup founder's Product Requirements Document.

Your job: surface investor-grade gaps, weak claims, and risks. Be specific. Cite the section.

Output strictly valid JSON in this exact shape:
{
  "findings": [
    {
      "sortOrder": 0,
      "category": "hype" | "gap" | "risk" | "evidence" | "metric" | "compliance" | "other",
      "severity": "critical" | "major" | "minor" | "info",
      "sectionId": "<section_id_or_null>",
      "title": "Short, specific issue title",
      "evidence": "What in the PRD triggered this finding (verbatim or paraphrased)",
      "suggestion": "Concrete, actionable change the founder can make"
    }
  ]
}

Rules:
- Max 50 findings. Aim for the highest-leverage 5–15 unless the PRD is large.
- DO NOT give legal, financial, tax, or medical advice. Flag concerns at a strategic level only.
- DO NOT invent facts not present in the PRD.
- DO NOT fix the PRD — propose changes only.
- Prefer concrete observations over generic warnings.
- "sectionId" must be a stable PRD section anchor when present; otherwise null.
- Output only the JSON object. No prose.`;

interface AiChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

function isAiChatCompletionResponse(value: unknown): value is AiChatCompletionResponse {
  return typeof value === 'object' && value !== null && 'choices' in value;
}

function extractContent(raw: unknown): string | null {
  if (!isAiChatCompletionResponse(raw)) return null;
  const first = raw.choices?.[0]?.message?.content;
  return typeof first === 'string' && first.length > 0 ? first : null;
}

function summarisePrdForPrompt(input: RedTeamGeneratorInput): string {
  const prdJson = input.prd.content !== null ? JSON.stringify(input.prd.content) : '(empty)';
  const truncated = prdJson.length > 60_000 ? `${prdJson.slice(0, 60_000)}... [TRUNCATED]` : prdJson;
  return [
    `Project name: ${input.projectName}`,
    `PRD version: v${input.prd.versionNumber} (status: ${input.prd.status}, deliverable: ${input.prd.deliverableKind})`,
    '',
    'PRD content (JSON):',
    truncated,
  ].join('\n');
}

function stubFindings(): RedTeamFindingDraft[] {
  return [
    {
      sortOrder: 0,
      category: 'gap',
      severity: 'major',
      sectionId: null,
      title: 'E2E stub red-team finding',
      evidence: 'E2E mode active — stub generator returns deterministic finding.',
      suggestion: 'No action required in test mode.',
      metadata: { source: 'e2e_stub' },
    },
  ];
}

export class RedTeamReportGeneratorAdapter implements IRedTeamGenerator {
  async generate(
    input: RedTeamGeneratorInput,
  ): Promise<Result<RedTeamFindingDraft[], ApplicationError>> {
    if (isE2eMode()) {
      return ok(stubFindings());
    }

    let response: Response;
    try {
      response = await callAI({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: summarisePrdForPrompt(input) },
        ],
        responseFormat: { type: 'json_object' },
        maxTokens: 6_000,
        temperature: 0.2,
      });
    } catch (error) {
      const message =
        error instanceof AiServiceError ? error.message : 'Red-team AI request failed';
      const status = error instanceof AiServiceError ? error.status : 502;
      return err(new ExternalServiceError('ai', message, status));
    }

    let rawJson: unknown;
    try {
      rawJson = (await response.json()) as unknown;
    } catch {
      return err(new ExternalServiceError('ai', 'Red-team AI returned non-JSON'));
    }

    const content = extractContent(rawJson);
    if (content === null) {
      return err(new ExternalServiceError('ai', 'Red-team AI returned empty content'));
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      logger.warn('Red-team AI content failed JSON.parse', { length: content.length });
      return err(new ExternalServiceError('ai', 'Red-team AI returned non-parseable JSON'));
    }

    const validated = RedTeamGeneratorOutputSchema.safeParse(parsed);
    if (!validated.success) {
      logger.warn('Red-team AI output failed schema validation', {
        issues: validated.error.flatten(),
      });
      return err(new ExternalServiceError('ai', 'Red-team AI output failed schema validation'));
    }

    const drafts: RedTeamFindingDraft[] = validated.data.findings.map((f, index) => ({
      sortOrder: typeof f.sortOrder === 'number' ? f.sortOrder : index,
      category: f.category,
      severity: f.severity,
      sectionId: f.sectionId,
      title: f.title,
      evidence: f.evidence,
      suggestion: f.suggestion,
      metadata: {},
    }));

    return ok(drafts);
  }
}
