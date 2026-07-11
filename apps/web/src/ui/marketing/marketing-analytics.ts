export const marketingAnalyticsEventName = 'zedos:marketing-analytics';

export const MarketingAnalyticsEvents = {
  LANDING_VIEWED: 'landing_viewed',
  LANDING_CTA_CLICKED: 'landing_cta_clicked',
  LANDING_SCENARIO_SELECTED: 'landing_scenario_selected',
  LANDING_FAQ_OPENED: 'landing_faq_opened',
  WAITLIST_CONTACT_FAILED: 'waitlist_contact_failed',
  WAITLIST_QUALIFICATION_VIEWED: 'waitlist_qualification_viewed',
  WAITLIST_QUALIFICATION_SKIPPED: 'waitlist_qualification_skipped',
} as const;

export type MarketingAnalyticsDetail = {
  event: (typeof MarketingAnalyticsEvents)[keyof typeof MarketingAnalyticsEvents];
  properties: Record<string, string | number | boolean>;
};

export function trackMarketingEvent(
  event: MarketingAnalyticsDetail['event'],
  properties: MarketingAnalyticsDetail['properties'] = {}
) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<MarketingAnalyticsDetail>(marketingAnalyticsEventName, {
      detail: { event, properties },
    })
  );
}
