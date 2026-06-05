export interface LinearConfig {
  readonly apiKey: string | null;
  readonly webhookSecret: string | null;
}

export function readLinearConfig(env: NodeJS.ProcessEnv = process.env): LinearConfig {
  return {
    apiKey: env.LINEAR_API_KEY?.trim() || null,
    webhookSecret: env.LINEAR_WEBHOOK_SECRET?.trim() || null,
  };
}
