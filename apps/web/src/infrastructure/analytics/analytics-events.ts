/** Funnel A + workspace events (infra-local; not cross-layer contracts). */

export const AnalyticsEvents = {
  SIGN_UP_COMPLETED: 'sign_up_completed',
  SIGN_UP_FAILED: 'sign_up_failed',
  SIGN_IN_COMPLETED: 'sign_in_completed',
  SIGN_IN_FAILED: 'sign_in_failed',
  PROJECT_CREATED: 'project_created',
  CLARIFY_MESSAGE_SENT: 'clarify_message_sent',
  CLARIFY_STREAM_COMPLETED: 'clarify_stream_completed',
  PRD_GENERATION_COMPLETED: 'prd_generation_completed',
  WORKSPACE_TAB_SELECTED: 'workspace_tab_selected',
  CLARIFY_BLOCKED_INSUFFICIENT_CREDITS: 'clarify_blocked_insufficient_credits',
  PRD_GENERATION_BLOCKED_INSUFFICIENT_CREDITS: 'prd_generation_blocked_insufficient_credits',
  CREDITS_DEPLETED_SURFACE_SHOWN: 'credits_depleted_surface_shown',
  CREDITS_PAGE_VIEWED: 'credits_page_viewed',
  CREDIT_PACK_CHECKOUT_STARTED: 'credit_pack_checkout_started',
  CREDIT_PACK_CHECKOUT_COMPLETED: 'credit_pack_checkout_completed',
  AUTO_RELOAD_ENABLED: 'auto_reload_enabled',
  AUTO_RELOAD_DISABLED: 'auto_reload_disabled',
} as const;

export type BalanceBucket = 'zero' | 'low' | 'ok';

/** Coarse balance segment for analytics (no exact balance in events). */
export function balanceBucketFromCount(balance: number): BalanceBucket {
  if (balance <= 0) return 'zero';
  if (balance < 10) return 'low';
  return 'ok';
}

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type WorkspaceTabAnalytics = 'clarify' | 'prd' | 'architecture' | 'history';

export type JourneyModeAnalytics = 'standard' | 'express';

export const FORBIDDEN_ANALYTICS_PROPERTY_KEYS = [
  'email',
  'password',
  'prd',
  'message',
  'token',
  'name',
  'content',
  'body',
  'transcript',
  'structured_question',
  'founder_answer',
] as const;

export type ForbiddenAnalyticsPropertyKey = (typeof FORBIDDEN_ANALYTICS_PROPERTY_KEYS)[number];

export type AnalyticsPropertyValue = string | number | boolean | null | undefined;

export type AnalyticsProperties = Record<string, AnalyticsPropertyValue>;
