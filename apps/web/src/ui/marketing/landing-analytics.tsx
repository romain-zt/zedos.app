'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  MarketingAnalyticsEvents,
  trackMarketingEvent,
} from './marketing-analytics';

export function LandingAnalytics() {
  useEffect(() => {
    trackMarketingEvent(MarketingAnalyticsEvents.LANDING_VIEWED, {
      page: 'wellness_prelaunch',
    });
  }, []);

  return null;
}

export function TrackedLink({
  href,
  placement,
  className,
  children,
  onClick,
}: {
  href: string;
  placement: string;
  className?: string;
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        trackMarketingEvent(MarketingAnalyticsEvents.LANDING_CTA_CLICKED, {
          placement,
          destination: href.startsWith('#') ? href.slice(1) : href,
        });
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
