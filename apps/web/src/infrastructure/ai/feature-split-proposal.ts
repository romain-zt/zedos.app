/**
 * AI wrapper for feature-split proposals.
 *
 * Calls the managed AI provider and validates the response against
 * FeatureSplitProposalSchema before returning. Keeps vendor isolation
 * inside infrastructure/ai/.
 */

import { FeatureSplitProposalSchema, FeatureSplitProposal } from '@repo/contracts/ai/feature-split-proposal';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ExternalServiceError } from '@shared/errors/application-error';
import { callAI } from '@/lib/ai-service';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'FeatureSplitProposalAI' });

const SYSTEM_PROMPT = `You are Zedos, an expert product architect.
Given a PRD, extract a structured feature split — a list of coherent service clusters.

Each cluster represents one independently deliverable area. Output strictly valid JSON:
{
  "clusters": [
    {
      "sortOrder": 0,
      "label": "Short cluster name (max 500 chars)",
      "valueLine": "Single sentence: the user value this cluster delivers (max 2000 chars)",
      "boundaryCue": "Single sentence: what this cluster does NOT include (max 2000 chars)"
    }
  ]
}

Rules:
- Between 2 and 32 clusters.
- Clusters must be non-overlapping and collectively exhaustive for the PRD scope.
- Do not invent features not present in the PRD.
- Output only the JSON object, no extra text.`;

export async function proposeFeatureSplit(
  prdContent: unknown
): Promise<Result<FeatureSplitProposal, ApplicationError>> {
  try {
    const aiResponse = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `PRD content:\n${JSON.stringify(prdContent, null, 2)}`,
        },
      ],
      responseFormat: { type: 'json_object' },
      maxTokens: 4000,
      temperature: 0.3,
    });

    const raw = await aiResponse.json();
    const text: string = raw?.choices?.[0]?.message?.content ?? '{}';

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      logger.error('AI returned non-JSON for feature split proposal', { text });
      return err(new ExternalServiceError('AI', 'AI returned invalid JSON for feature split'));
    }

    const validated = FeatureSplitProposalSchema.safeParse(parsed);
    if (!validated.success) {
      logger.error('AI proposal failed schema validation', { errors: validated.error.flatten() });
      return err(new ExternalServiceError('AI', 'AI proposal did not match expected schema'));
    }

    return ok(validated.data);
  } catch (error) {
    logger.error('Feature split AI call failed', error);
    return err(new ExternalServiceError('AI', 'Feature split proposal failed'));
  }
}
