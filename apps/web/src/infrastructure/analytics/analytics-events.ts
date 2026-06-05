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
  CLARIFY_FAILED: 'clarify_failed',
  PRD_GENERATION_FAILED: 'prd_generation_failed',
  CHUNK_LOAD_ERROR: 'chunk_load_error',
  CLIENT_EXCEPTION: 'client_exception',
  SERVER_EXCEPTION: 'server_exception',
  NEXT_ACTION_BANNER_SHOWN: 'next_action_banner_shown',
  NEXT_ACTION_BANNER_CTA_CLICKED: 'next_action_banner_cta_clicked',
  COMMENTER_INVITED: 'commenter_invited',
  COMMENTER_REVOKED: 'commenter_revoked',
  SECTION_COMMENT_CREATED: 'section_comment_created',
  THREAD_RESOLVED: 'thread_resolved',
  TEMPLATE_CATALOG_VIEWED: 'template_catalog_viewed',
  TEMPLATE_PREVIEW_OPENED: 'template_preview_opened',
  PROJECT_CREATED_FROM_TEMPLATE: 'project_created_from_template',
  SUBSCRIPTION_CHECKOUT_STARTED: 'subscription_checkout_started',
  SUBSCRIPTION_ACTIVATED: 'subscription_activated',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  CUSTOMER_PORTAL_OPENED: 'customer_portal_opened',
  CURSOR_EXPORT_GATE_SHOWN: 'cursor_export_gate_shown',
  CURSOR_EXPORT_GATE_UPGRADE_CLICKED: 'cursor_export_gate_upgrade_clicked',
  CURSOR_EXPORT_COMPLETED: 'cursor_export_completed',
  DATA_ROOM_ZIP_DOWNLOADED: 'data_room_zip_downloaded',
  RED_TEAM_REVIEW_STARTED: 'red_team_review_started',
  RED_TEAM_REVIEW_COMPLETED: 'red_team_review_completed',
  RED_TEAM_REVIEW_FAILED: 'red_team_review_failed',
} as const;

export type BalanceBucket = 'zero' | 'low' | 'ok';

/** Coarse balance segment for analytics (no exact balance in events). */
export function balanceBucketFromCount(balance: number): BalanceBucket {
  if (balance <= 0) return 'zero';
  if (balance < 10) return 'low';
  return 'ok';
}

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type WorkspaceTabAnalytics = 'clarify' | 'prd' | 'architecture' | 'history' | 'decisions';

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
