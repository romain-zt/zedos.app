/**
 * AI wrapper for user-story draft generation — outline pass then one story per call.
 */

import {
  UserStoryAiOutlineListSchema,
  UserStoryAiSingleDraftSchema,
  type UserStoryAiDraftItem,
  type UserStoryAiOutlineItem,
} from '@repo/contracts';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ExternalServiceError } from '@shared/errors/application-error';
import { callAI } from '@/lib/ai-service';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'UserStoryDraftAI' });

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const USER_STORY_DRAFT_OUTLINE_TIMEOUT_MS = parsePositiveIntEnv(
  'AI_USER_STORY_DRAFT_OUTLINE_TIMEOUT_MS',
  60_000
);
const USER_STORY_DRAFT_SINGLE_TIMEOUT_MS = parsePositiveIntEnv(
  'AI_USER_STORY_DRAFT_SINGLE_TIMEOUT_MS',
  90_000
);
const USER_STORY_DRAFT_MAX_STORIES = Math.min(
  32,
  parsePositiveIntEnv('AI_USER_STORY_DRAFT_MAX_STORIES', 12)
);

const OUTLINE_SYSTEM_PROMPT = `You are Zedos, a product manager. Given one feature cluster summary, list distinct user-visible behaviors as short titles only.

Output strictly valid JSON:
{ "outlines": [ { "title": "..." } ] }

Rules:
- 1 to 32 outlines.
- Each title names exactly ONE distinct user-visible behavior — something an end user can notice without knowing internals.
- Do not duplicate or near-duplicate intents; each title must differ.
- Titles: short verb phrases, max 2000 chars. No body text.
- Reflect only the cluster scope — do not invent unrelated scope.
- Output only the JSON object, no extra text.`;

const SINGLE_STORY_SYSTEM_PROMPT = `You are Zedos, a product manager. Expand ONE user-visible behavior into a full user story for a feature cluster.

Output strictly valid JSON:
{ "story": { "title": "...", "body": "...", "sortOrder": 0 } }

Rules:
- Exactly one story in "story".
- Title: short verb phrase for this behavior only, max 2000 chars (may match the outline title).
- Body: begin with "### User-visible outcome" (2–4 sentences); then 3–6 bullet acceptance criteria. Keep under 2500 characters total.
- sortOrder is optional.
- Do not merge unrelated behaviors; stay on the provided outline only.
- Do NOT copy cluster fields (label, valueLine, boundaryCue) verbatim as the story body — paraphrase into user-visible behavior and acceptance criteria.
- Body must end with observable acceptance signals.
- Output only the JSON object, no extra text.`;

function clusterPayload(input: { label: string; valueLine: string; boundaryCue: string }): string {
  return JSON.stringify(
    {
      label: input.label,
      valueLine: input.valueLine,
      boundaryCue: input.boundaryCue,
    },
    null,
    2
  );
}

async function parseAiJsonContent<T>(
  raw: unknown,
  label: string,
  validate: (parsed: unknown) => { success: true; data: T } | { success: false }
): Promise<Result<T, ApplicationError>> {
  const text: string =
    typeof raw === 'object' && raw !== null && 'choices' in raw
      ? String((raw as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? '{}')
      : '{}';

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    logger.error(`AI returned non-JSON for ${label}`, { text });
    return err(new ExternalServiceError('AI', `AI returned invalid JSON for ${label}`));
  }

  const validated = validate(parsed);
  if (!validated.success) {
    logger.error(`AI ${label} failed schema validation`, { parsed });
    return err(new ExternalServiceError('AI', `AI ${label} did not match expected schema`));
  }

  return ok(validated.data);
}

export async function draftOutlinesForCluster(input: {
  label: string;
  valueLine: string;
  boundaryCue: string;
}): Promise<Result<UserStoryAiOutlineItem[], ApplicationError>> {
  const aiResponse = await callAI({
    messages: [
      { role: 'system', content: OUTLINE_SYSTEM_PROMPT },
      { role: 'user', content: `Feature cluster:\n${clusterPayload(input)}` },
    ],
    responseFormat: { type: 'json_object' },
    maxTokens: 2000,
    temperature: 0.25,
    timeoutMs: USER_STORY_DRAFT_OUTLINE_TIMEOUT_MS,
  });

  const raw = await aiResponse.json();
  const listResult = await parseAiJsonContent(raw, 'user story outlines', (parsed) => {
    const validated = UserStoryAiOutlineListSchema.safeParse(parsed);
    return validated.success
      ? { success: true as const, data: validated.data.outlines }
      : { success: false as const };
  });
  if (listResult.isErr()) return listResult;

  const capped = listResult.unwrap().slice(0, USER_STORY_DRAFT_MAX_STORIES);
  if (capped.length === 0) {
    return err(new ExternalServiceError('AI', 'AI returned no user story outlines'));
  }

  return ok(capped);
}

export async function draftSingleStoryForCluster(
  input: { label: string; valueLine: string; boundaryCue: string },
  outline: UserStoryAiOutlineItem,
  sortOrder: number
): Promise<Result<UserStoryAiDraftItem, ApplicationError>> {
  const aiResponse = await callAI({
    messages: [
      { role: 'system', content: SINGLE_STORY_SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          `Feature cluster:\n${clusterPayload(input)}`,
          `Outline to expand (sortOrder ${sortOrder}):\n${JSON.stringify(outline, null, 2)}`,
        ].join('\n\n'),
      },
    ],
    responseFormat: { type: 'json_object' },
    maxTokens: 1400,
    temperature: 0.35,
    timeoutMs: USER_STORY_DRAFT_SINGLE_TIMEOUT_MS,
  });

  const raw = await aiResponse.json();
  const storyResult = await parseAiJsonContent(raw, 'single user story', (parsed) => {
    const validated = UserStoryAiSingleDraftSchema.safeParse(parsed);
    return validated.success
      ? { success: true as const, data: validated.data.story }
      : { success: false as const };
  });
  if (storyResult.isErr()) return storyResult;

  const story = storyResult.unwrap();
  return ok({
    title: story.title,
    body: story.body,
    sortOrder: story.sortOrder ?? sortOrder,
  });
}

