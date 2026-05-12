/**
 * AI wrapper for user-story drafts from confirmed feature-split cluster context.
 */

import {
  UserStoryAiDraftListSchema,
  type UserStoryAiDraftList,
} from '@repo/contracts/user-stories/generate';
import { Result, ok, err } from '@repo/result';
import { ExternalServiceError, type ApplicationError } from '@shared/errors/application-error';
import { callAI } from '@/lib/ai-service';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'UserStoryDraftAI' });

const SYSTEM_PROMPT = `You are Zedos, an expert agile analyst.
Given the structured context for ONE confirmed feature-split cluster, propose concrete user stories.

Output strictly valid JSON:
{
  "stories": [
    {
      "title": "Short imperative title",
      "body": "Full story text with acceptance criteria where helpful",
      "sortOrder": 0
    }
  ]
}

Rules:
- Between 1 and 40 stories.
- Stories must align with the cluster value line and respect the boundary cue (do not expand scope beyond it).
- sortOrder is optional; when omitted, preserve array order starting at 0.
- Output only the JSON object, no extra text.`;

export interface ClusterStoryDraftContext {
  label: string;
  valueLine: string;
  boundaryCue: string;
}

export async function draftUserStoriesFromClusterContext(
  ctx: ClusterStoryDraftContext
): Promise<Result<UserStoryAiDraftList, ApplicationError>> {
  try {
    const aiResponse = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Cluster label: ${ctx.label}\nValue line: ${ctx.valueLine}\nBoundary cue: ${ctx.boundaryCue}`,
        },
      ],
      responseFormat: { type: 'json_object' },
      maxTokens: 8000,
      temperature: 0.35,
    });

    const raw = await aiResponse.json();
    const text: string = raw?.choices?.[0]?.message?.content ?? '{}';

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      logger.error('AI returned non-JSON for user story draft', { text });
      return err(new ExternalServiceError('AI', 'AI returned invalid JSON for user stories'));
    }

    const validated = UserStoryAiDraftListSchema.safeParse(parsed);
    if (!validated.success) {
      logger.error('AI user story draft failed schema validation', {
        errors: validated.error.flatten(),
      });
      return err(new ExternalServiceError('AI', 'AI user story draft did not match expected schema'));
    }

    return ok(validated.data);
  } catch (error) {
    logger.error('User story draft AI call failed', error);
    return err(new ExternalServiceError('AI', 'User story draft generation failed'));
  }
}
