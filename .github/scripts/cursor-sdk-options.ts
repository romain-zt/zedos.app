/**
 * Shared Cursor cloud SDK options for CI scripts in this directory.
 */
const DEFAULT_AGENT_MODEL_ID = "composer-2";

export function buildCursorCloudOptions(
  apiKey: string,
  repoSlug: string,
): {
  apiKey: string;
  model: { id: string };
  cloud: { repos: { url: string }[]; autoCreatePR: boolean; skipReviewerRequest: boolean };
} {
  const modelId = process.env.CURSOR_AGENT_MODEL?.trim() || DEFAULT_AGENT_MODEL_ID;
  const cloud = {
    repos: [{ url: `https://github.com/${repoSlug}` }],
    autoCreatePR: false,
    skipReviewerRequest: true,
  };
  return { apiKey, model: { id: modelId }, cloud };
}
