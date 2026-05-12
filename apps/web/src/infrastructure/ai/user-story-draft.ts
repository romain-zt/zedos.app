/**
 * AI-assisted user-story draft generation — validates model output against
 * UserStoryAiDraftListSchema before any persistence or credit deduction.
 */

import {
  UserStoryAiDraftList,
  UserStoryAiDraftListSchema,
} from '@repo/contracts/user-stories/generate';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ExternalServiceError } from '@shared/errors/application-error';
import { callAI } from '@/lib/ai-service';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'UserStoryDraftAI' });

export type UserStoryClusterContext = {
  label: string;
  valueLine: string;
  boundaryCue: string;
};

const SYSTEM_PROMPT = `You are Zedos, an expert agile product analyst.
Given ONE confirmed feature-split cluster (label, value line, boundary), produce actionable user stories.
Output strictly valid JSON matching:
{ "stories": [ { "title": string, "body": string, "sortOrder"?: non-negative integer } ] }

Rules:
- 2 to 20 stories.
- Each story is behavioral (As a/I want/so that framing is fine in body), testable, and scoped within the boundary cue.
- Do not invent product scope absent from the cluster text.
- Titles concise (under 500 chars); bodies substantive (implementation hints ok).
- Assign sortOrder starting at 0 and increasing if you omit it defaults are inferred — prefer explicit sortOrder 0..n-1.
- Output only the JSON object, no extra text.`;

export async function draftUserStoriesWithAi(
  cluster: UserStoryClusterContext
): Promise<Result<UserStoryAiDraftList, ApplicationError>> {
  try {
    const userPayload = {
      cluster: {
        label: cluster.label,
        valueLine: cluster.valueLine,
        boundaryCue: cluster.boundaryCue,
      },
    };

    const aiResponse = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(userPayload, null, 2) },
      ],
      responseFormat: { type: 'json_object' },
      maxTokens: 6000,
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
      logger.error('User story AI output failed validation', {
        errors: validated.error.flatten(),
      });
      return err(new ExternalServiceError('AI', 'AI user story output did not match expected schema'));
    }

    return ok(validated.data);
  } catch (error) {
    logger.error('User story AI call failed', error);
    return err(new ExternalServiceError('AI', 'User story draft generation failed'));
  }
}
