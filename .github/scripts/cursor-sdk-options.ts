/**
 * Shared Cursor cloud SDK options for CI scripts in this directory.
 */
export function buildCursorCloudOptions(
  apiKey: string,
  repoSlug: string,
): {
  apiKey: string;
  model?: { id: string };
  cloud: { repos: { url: string }[]; autoCreatePR: boolean; skipReviewerRequest: boolean };
} {
  const modelId = process.env.CURSOR_AGENT_MODEL?.trim();
  const cloud = {
    repos: [{ url: `https://github.com/${repoSlug}` }],
    autoCreatePR: false,
    skipReviewerRequest: true,
  };
  const base = { apiKey, cloud };
  return modelId ? { ...base, model: { id: modelId } } : base;
}
