'use client';

import { useEffect } from 'react';
import { captureClient } from '@infrastructure/analytics/posthog-client';
import {
  marketingAnalyticsEventName,
  type MarketingAnalyticsDetail,
} from '@/src/ui/marketing/marketing-analytics';

export function MarketingAnalyticsBridge() {
  useEffect(() => {
    function captureMarketingEvent(event: Event) {
      const customEvent = event as CustomEvent<MarketingAnalyticsDetail>;
      captureClient(customEvent.detail.event, customEvent.detail.properties);
    }

    window.addEventListener(marketingAnalyticsEventName, captureMarketingEvent);
    return () => {
      window.removeEventListener(marketingAnalyticsEventName, captureMarketingEvent);
    };
  }, []);

  return null;
}
