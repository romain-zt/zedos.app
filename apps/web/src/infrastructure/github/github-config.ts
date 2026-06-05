/**
 * Environment-bound configuration for the GitHub integration. Reading is
 * centralized here so use cases can stay pure and tests can stub the surface.
 */

export interface GithubConfig {
  readonly clientId: string | null;
  readonly clientSecret: string | null;
  readonly webhookSecret: string | null;
  readonly oauthRedirectBaseUrl: string | null;
}

export function readGithubConfig(env: NodeJS.ProcessEnv = process.env): GithubConfig {
  return {
    clientId: env.GITHUB_APP_CLIENT_ID?.trim() || null,
    clientSecret: env.GITHUB_APP_CLIENT_SECRET?.trim() || null,
    webhookSecret: env.GITHUB_WEBHOOK_SECRET?.trim() || null,
    oauthRedirectBaseUrl: env.GITHUB_OAUTH_REDIRECT_BASE_URL?.trim() || null,
  };
}

export interface WeeklyDigestEnv {
  readonly enabled: boolean;
  readonly cronSecret: string | null;
}

export function readWeeklyDigestEnv(env: NodeJS.ProcessEnv = process.env): WeeklyDigestEnv {
  return {
    enabled: env.DRIFT_WEEKLY_DIGEST_ENABLED?.trim().toLowerCase() === 'true',
    cronSecret: env.CRON_SHARED_SECRET?.trim() || null,
  };
}
