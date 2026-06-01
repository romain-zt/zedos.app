/**
 * AI wrapper for task-split draft generation — ordered tasks with Cursor-ready prompts.
 */

import { TaskSplitAiDraftListSchema } from '@repo/contracts/task-split';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ExternalServiceError } from '@shared/errors/application-error';
import type { SaveTaskSplitTaskInput } from '@domain/task-split/task-split-bundle';
import type { TaskSplitStoryContext } from '@domain/task-split/task-split-draft-generator';
import { callAI } from '@/lib/ai-service';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'TaskSplitDraftAI' });

function parsePositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const TASK_SPLIT_DRAFT_TIMEOUT_MS = parsePositiveIntEnv('AI_TASK_SPLIT_DRAFT_TIMEOUT_MS', 90_000);

const SYSTEM_PROMPT = `You are Zedos, a technical product lead preparing implementation work for an AI coding agent (Cursor).

Given one user story, output an ordered list of small, focused implementation tasks. Each task must include a Cursor-ready prompt.

Output strictly valid JSON:
{
  "tasks": [
    { "title": "...", "promptBody": "...", "sortOrder": 0 }
  ]
}

Rules:
- 3 to 12 tasks, ordered by sensible build sequence (dependencies first).
- Each title: short verb phrase, max 2000 chars.
- Each promptBody: self-contained instructions for one coding session — context, files/layers to touch if inferable from the story, acceptance signals, and explicit "do not" boundaries. Max 20000 chars.
- Stay within the user story scope; do not invent unrelated features.
- Do not output test-framework boilerplate unless the story explicitly requires it.
- Output only the JSON object, no extra text.`;

async function parseAiJsonContent<T>(
  raw: unknown,
  label: string,
  validate: (parsed: unknown) => { success: true; data: T } | { success: false }
): Promise<Result<T, ApplicationError>> {
  if (!raw || typeof raw !== 'object') {
    return err(new ExternalServiceError('ai', `Invalid ${label} response shape`));
  }

  const content =
    'choices' in raw &&
    Array.isArray((raw as { choices: { message?: { content?: string } }[] }).choices)
      ? (raw as { choices: { message?: { content?: string } }[] }).choices[0]?.message?.content
      : null;

  if (!content || typeof content !== 'string') {
    return err(new ExternalServiceError('ai', `Missing ${label} content`));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content) as unknown;
  } catch {
    logger.warn('AI returned non-JSON', { label });
    return err(new ExternalServiceError('ai', `Failed to parse ${label} JSON`));
  }

  const validated = validate(parsed);
  if (!validated.success) {
    return err(new ExternalServiceError('ai', `AI ${label} failed schema validation`));
  }
  return ok(validated.data);
}

export async function draftTasksForStory(
  story: TaskSplitStoryContext
): Promise<Result<SaveTaskSplitTaskInput[], ApplicationError>> {
  const aiResponse = await callAI({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          `User story title:\n${story.title}`,
          `User story body:\n${story.body}`,
        ].join('\n\n'),
      },
    ],
    responseFormat: { type: 'json_object' },
    maxTokens: 4000,
    temperature: 0.35,
    timeoutMs: TASK_SPLIT_DRAFT_TIMEOUT_MS,
  });

  const raw = await aiResponse.json();
  const listResult = await parseAiJsonContent(raw, 'task split draft', (parsed) => {
    const validated = TaskSplitAiDraftListSchema.safeParse(parsed);
    return validated.success
      ? { success: true as const, data: validated.data }
      : { success: false as const };
  });

  if (listResult.isErr()) {
    return err(listResult.error);
  }

  const tasks = listResult.unwrap().tasks;
  const normalized: SaveTaskSplitTaskInput[] = [];

  for (let index = 0; index < tasks.length; index++) {
    const task = tasks[index];
    const title = task.title.trim();
    const promptBody = task.promptBody.trim();
    if (!title || !promptBody) {
      return err(new ExternalServiceError('ai', 'AI returned a task without title or prompt'));
    }
    normalized.push({
      sortOrder: task.sortOrder ?? index,
      title,
      promptBody,
      manual: false,
    });
  }

  return ok(normalized);
}
