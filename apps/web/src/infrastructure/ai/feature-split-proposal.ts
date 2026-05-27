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
import { AiServiceError, callAI } from '@/lib/ai-service';
import { formatPrdContentForAi } from '@/lib/prd-content-for-ai';
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
- Return at least 2 clusters and at most 32.
- Never return an empty clusters array.
- Clusters must be non-overlapping and collectively exhaustive for the PRD scope.
- Do not invent features not present in the PRD.
- Output only the JSON object, no extra text.`;

const RETRY_USER_SUFFIX = `IMPORTANT: Your previous answer was rejected because clusters was empty or invalid.
You MUST return at least 2 clusters with non-empty label, valueLine, and boundaryCue for each.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapAiFailure(error: unknown): ExternalServiceError {
  if (error instanceof AiServiceError) {
    if (error.status === 503) {
      return new ExternalServiceError('ai', 'AI provider is not configured on this server', 503);
    }
    if (error.status === 504) {
      return new ExternalServiceError(
        'ai',
        'AI request timed out — try again or shorten your PRD',
        504
      );
    }
    return new ExternalServiceError(
      'ai',
      'OpenAI could not generate a feature split — try again in a moment',
      502,
      { upstreamStatus: error.status }
    );
  }

  return new ExternalServiceError('ai', 'Feature split proposal failed', 502);
}

async function requestProposal(
  prdText: string,
  retryHint?: string
): Promise<Result<FeatureSplitProposal, ApplicationError>> {
  const userContent = retryHint
    ? `PRD content:\n${prdText}\n\n${retryHint}`
    : `PRD content:\n${prdText}`;

  const aiResponse = await callAI({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
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
    return err(new ExternalServiceError('ai', 'AI returned invalid JSON for feature split'));
  }

  const validated = FeatureSplitProposalSchema.safeParse(parsed);
  if (validated.success) {
    return ok(validated.data);
  }

  const emptyClusters =
    isRecord(parsed) && Array.isArray(parsed.clusters) && parsed.clusters.length === 0;

  logger.error('AI proposal failed schema validation', {
    errors: validated.error.flatten(),
    emptyClusters,
  });

  if (emptyClusters) {
    return err(
      new ExternalServiceError(
        'ai',
        'AI returned no clusters for this PRD — enrich the PRD in the workspace or use “From PRD sections”',
        422
      )
    );
  }

  return err(new ExternalServiceError('ai', 'AI proposal did not match expected schema', 422));
}

export async function proposeFeatureSplit(
  prdContent: unknown
): Promise<Result<FeatureSplitProposal, ApplicationError>> {
  const prdText = formatPrdContentForAi(prdContent);

  try {
    const first = await requestProposal(prdText);
    if (first.isOk()) return first;

    if (first.error.statusCode !== 422) {
      return first;
    }

    const retry = await requestProposal(prdText, RETRY_USER_SUFFIX);
    return retry;
  } catch (error) {
    logger.error('Feature split AI call failed', error);
    return err(mapAiFailure(error));
  }
}
