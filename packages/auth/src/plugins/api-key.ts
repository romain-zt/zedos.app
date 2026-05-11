/**
 * @repo/auth API key plugin — DISABLED in v0
 *
 * This plugin is a stub for v2/v3 API key authentication.
 * Do NOT enable this plugin via PR.
 *
 * Activation requires ALL of these steps in the same release:
 * 1. A product decision in docs/product-decisions/ describing the use case
 *    (programmatic access? agent integration? webhook signing?)
 * 2. A scope schema in packages/contracts/auth/api-key.ts describing permitted scopes
 * 3. A migration step adding the API key tables (better-auth supplies them)
 * 4. Rate-limit rules per key id, not per IP
 * 5. A revocation UI surface in the dashboard (separate Scope Slice)
 *
 * See: .cursor/rules/76-better-auth.mdc §6 for full requirements
 */

export const API_KEY_PLUGIN_ENABLED = false;

export const apiKeyPluginConfig = {
  enabled: API_KEY_PLUGIN_ENABLED,
  
  scopes: [] as const,

  rateLimit: {
    enabled: false,
    maxRequests: 1000,
    windowMs: 60 * 1000,
  },
};

export function getApiKeyPlugin() {
  if (!API_KEY_PLUGIN_ENABLED) {
    return null;
  }

  return null;
}
