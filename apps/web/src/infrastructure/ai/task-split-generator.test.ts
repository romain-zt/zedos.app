import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/ai-service', () => ({
  callAI: vi.fn(),
}));

import { callAI } from '@/lib/ai-service';
import { generateTasksFromStories } from './task-split-generator';

function mockOpenAiEnvelope(content: unknown): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 }
  );
}

describe('generateTasksFromStories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts tasks from OpenAI chat completion envelope', async () => {
    vi.mocked(callAI).mockResolvedValue(
      mockOpenAiEnvelope({
        tasks: [
          {
            title: 'Add migration',
            promptBody: 'Create the payments table migration with Drizzle.',
          },
        ],
      })
    );

    const result = await generateTasksFromStories('User story: Checkout flow', 'Project: Acme');

    expect(result.isOk()).toBe(true);
    expect(result.unwrap()).toEqual([
      {
        title: 'Add migration',
        promptBody: 'Create the payments table migration with Drizzle.',
      },
    ]);
  });

  it('returns error when message content does not match task split schema', async () => {
    vi.mocked(callAI).mockResolvedValue(mockOpenAiEnvelope({ clusters: [] }));

    const result = await generateTasksFromStories('story', 'context');

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain('Invalid AI response shape for task split');
    }
  });
});
