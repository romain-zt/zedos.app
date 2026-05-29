/**
 * When E2E_MODE=true, infrastructure uses deterministic stubs (no Stripe/OpenAI).
 * Set only by Playwright config / CI — never in production.
 */
export function isE2eMode(): boolean {
  return process.env.E2E_MODE === 'true';
}

/** Stripe checkout session ids created in E2E mode: `e2e_session_<purchaseId>` */
export function buildE2eCheckoutSessionId(purchaseId: string): string {
  return `e2e_session_${purchaseId}`;
}

export function parseE2eCheckoutSessionId(sessionId: string): string | null {
  const prefix = 'e2e_session_';
  if (!sessionId.startsWith(prefix)) return null;
  const purchaseId = sessionId.slice(prefix.length);
  return purchaseId.length > 0 ? purchaseId : null;
}

const E2E_PRD_JSON = JSON.stringify({
  title: 'E2E Test Product',
  version_summary: 'Deterministic PRD generated during Playwright E2E runs.',
  sections: [
    {
      id: 'vision',
      title: 'Product Vision & Problem Statement',
      content: 'Founders need a fast path from idea to a structured PRD.',
      confidence: 'high',
      open_questions: [],
    },
    {
      id: 'target_users',
      title: 'Target Users & Personas',
      content: 'Solo founders and small product teams.',
      confidence: 'high',
      open_questions: [],
    },
    {
      id: 'core_features',
      title: 'Core Features (MVP Scope)',
      content: 'Guided clarification, PRD generation, credit-based AI usage.',
      confidence: 'medium',
      open_questions: [],
    },
  ],
});

/** OpenAI-compatible SSE body for `createBufferedStreamingResponse`. */
export function createE2eAiStreamResponse(): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const chunk = `data: ${JSON.stringify({
        choices: [{ delta: { content: E2E_PRD_JSON } }],
      })}\n\n`;
      controller.enqueue(encoder.encode(chunk));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
