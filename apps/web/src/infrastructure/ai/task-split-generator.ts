/**
 * AI wrapper for task split generation — one call produces a list of Cursor tasks
 * from the project's user story corpus.
 */

import { GenerateTaskSplitAiResponseSchema, type GeneratedTaskItem } from '@repo/contracts/task-split';
import { Result, ok, err } from '@repo/result';
import { ApplicationError, ExternalServiceError } from '@shared/errors/application-error';
import { callAI } from '@/lib/ai-service';
import { createLogger } from '@shared/observability/logger';

const logger = createLogger({ service: 'TaskSplitGeneratorAI' });

const TASK_SPLIT_SYSTEM_PROMPT = `You are Zedos, a senior software engineer. Given user stories from a product feature, generate a list of concrete Cursor-ready implementation tasks.

Output strictly valid JSON:
{ "tasks": [ { "title": "...", "promptBody": "..." } ] }

Rules:
- 3 to 15 tasks, ordered by implementation dependency (foundations first).
- Each task title: short imperative phrase, max 100 chars (e.g. "Add DB migration for payments table").
- Each promptBody: a detailed Cursor prompt the developer pastes into Cursor to implement that single task. Include: what to build, which files to touch, acceptance criteria. 200–800 chars.
- Tasks must be atomic — one commit, one concern each.
- Do not duplicate or near-duplicate tasks.
- Output only the JSON object, no extra text.`;

export async function generateTasksFromStories(
  storySummary: string,
  projectContext: string
): Promise<Result<GeneratedTaskItem[], ApplicationError>> {
  const userMessage = `Project context:\n${projectContext}\n\nUser stories:\n${storySummary}`;

  let aiResponse: Response;
  try {
    aiResponse = await callAI({
      messages: [
        { role: 'system', content: TASK_SPLIT_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      responseFormat: { type: 'json_object' },
      maxTokens: 3000,
      temperature: 0.3,
      timeoutMs: 90_000,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    logger.error('AI call failed for task split generation', { error: message });
    return err(new ExternalServiceError('AI', message, 502));
  }

  let envelope: unknown;
  try {
    envelope = await aiResponse.json();
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    logger.error('Failed to parse AI response JSON for task split', { error: message });
    return err(new ExternalServiceError('AI', 'Failed to parse AI response', 502));
  }

  const text: string =
    typeof envelope === 'object' && envelope !== null && 'choices' in envelope
      ? String(
          (envelope as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message
            ?.content ?? '{}'
        )
      : '{}';

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    logger.error('AI returned non-JSON content for task split', { text, error: message });
    return err(new ExternalServiceError('AI', 'AI returned invalid JSON for task split', 502));
  }

  const validated = GenerateTaskSplitAiResponseSchema.safeParse(parsed);
  if (!validated.success) {
    logger.error('Task split AI response validation failed', { errors: validated.error.flatten() });
    return err(new ExternalServiceError('AI', 'Invalid AI response shape for task split', 502));
  }

  return ok(validated.data.tasks);
}
