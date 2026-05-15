/**
 * AI wrapper for user-story draft generation — validates against UserStoryAiDraftListSchema.
 */

import { UserStoryAiDraftListSchema, type UserStoryAiDraftList } from '@repo/contracts';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ExternalServiceError } from '@shared/errors/application-error';
import { callAI } from '@/lib/ai-service';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'UserStoryDraftAI' });

const SYSTEM_PROMPT = `You are Zedos, a product manager. Given one feature cluster summary, produce user stories as implementation-ready statements.

Output strictly valid JSON:
{ "stories": [ { "title": "...", "body": "...", "sortOrder": 0 } ] }

Rules:
- 1 to 32 stories.
- Each story captures exactly ONE distinct user-visible behavior — something an end user can notice on the product surface (screens, messages, emails, limits shown to them) without knowing internals. If the cluster implies multiple behaviors, emit multiple stories; never cram unrelated behaviors into a single story.
- Do not duplicate or near-duplicate the same behavior across stories; titles must describe different intents.
- Each title: short verb phrase naming that single behavior, max 2000 chars.
- Each body: begin with a line "### User-visible outcome" followed by the observable result; then Given/When/Then or bullet acceptance criteria (include boundary cases hinted by the cluster when relevant). Max 50000 chars.
- sortOrder is optional; when omitted, preserve array order starting at 0.
- Stories must reflect only the cluster scope — do not invent unrelated scope.
- Each story must describe exactly one distinct user-visible capability or outcome; split overloaded clusters rather than merging unrelated behaviors.
- Do not paste or lightly restyle raw cluster fields (label/valueLine/boundaryCue JSON or bullets) as the whole story — turn hints into concrete product behaviors an engineer could ship.
- Every story body must end with observable acceptance signals (what a reviewer could verify manually or via automated checks).
- Output only the JSON object, no extra text.`;

export async function draftUserStoriesWithAi(input: {
  label: string;
  valueLine: string;
  boundaryCue: string;
}): Promise<Result<UserStoryAiDraftList, ApplicationError>> {
  try {
    const userPayload = JSON.stringify(
      {
        label: input.label,
        valueLine: input.valueLine,
        boundaryCue: input.boundaryCue,
      },
      null,
      2
    );

    const aiResponse = await callAI({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Feature cluster:\n${userPayload}` },
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
      logger.error('User story AI draft failed schema validation', {
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
