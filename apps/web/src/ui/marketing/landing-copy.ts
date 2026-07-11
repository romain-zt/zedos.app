import { landingCopyEn } from './landing-copy.en';
import { landingCopyFr } from './landing-copy.fr';
import type { LandingCopy, MarketingLocale } from './landing-copy.types';

const landingCopy: Record<MarketingLocale, LandingCopy> = {
  en: landingCopyEn,
  fr: landingCopyFr,
};

export function getLandingCopy(locale: MarketingLocale): LandingCopy {
  return landingCopy[locale];
}

export type { LandingCopy, MarketingLocale } from './landing-copy.types';
