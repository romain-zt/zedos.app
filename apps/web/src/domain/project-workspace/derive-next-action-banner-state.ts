/**
 * Next-action banner state derivation (pure).
 *
 * Maps already-loaded workspace data to a single banner state per
 * `docs/product/next-action-banner-spec.md`. The function is pure: no IO,
 * no side effects. UI is responsible for telemetry and rendering.
 *
 * Priority: first unsatisfied state in S1→S6 order, with S5 overriding when
 * `journeyMode === 'express'` and at least one PRD version exists.
 *
 * S0 (dashboard zero-projects) and S6 (builder export completed) are out of
 * scope for v1: S0 belongs on the dashboard surface, and S6 requires a
 * persistent "first export" flag that the current schema does not expose.
 */
import type { JourneyMode } from '@repo/contracts/project/project-contracts';

export type NextActionBannerStateId = 'S1' | 'S2' | 'S3' | 'S4' | 'S5';

export type NextActionBannerCtaActionType =
  | 'switch-tab-clarify'
  | 'switch-tab-prd'
  | 'navigate-delivery'
  | 'switch-mode-standard';

export interface NextActionBannerCta {
  readonly labelKey: string;
  readonly action: NextActionBannerCtaActionType;
}

export interface NextActionBannerState {
  readonly stateId: NextActionBannerStateId;
  readonly titleKey: string;
  readonly bodyKey: string | null;
  readonly primary: NextActionBannerCta;
  readonly secondary: NextActionBannerCta | null;
}

export interface NextActionBannerInputs {
  readonly journeyMode: JourneyMode;
  readonly prdVersionCount: number;
  readonly questionHistoryCount: number;
  readonly hasActiveShareLinkOnLatestPrd: boolean;
  readonly loading: boolean;
}

const STATE_S1: NextActionBannerState = {
  stateId: 'S1',
  titleKey: 'nextActionBanner.s1.title',
  bodyKey: 'nextActionBanner.s1.body',
  primary: {
    labelKey: 'nextActionBanner.s1.cta.primary',
    action: 'switch-tab-clarify',
  },
  secondary: null,
};

const STATE_S2: NextActionBannerState = {
  stateId: 'S2',
  titleKey: 'nextActionBanner.s2.title',
  bodyKey: 'nextActionBanner.s2.body',
  primary: {
    labelKey: 'nextActionBanner.s2.cta.primary',
    action: 'switch-tab-clarify',
  },
  secondary: null,
};

const STATE_S3: NextActionBannerState = {
  stateId: 'S3',
  titleKey: 'nextActionBanner.s3.title',
  bodyKey: 'nextActionBanner.s3.body',
  primary: {
    labelKey: 'nextActionBanner.s3.cta.primary',
    action: 'switch-tab-prd',
  },
  secondary: null,
};

const STATE_S4: NextActionBannerState = {
  stateId: 'S4',
  titleKey: 'nextActionBanner.s4.title',
  bodyKey: 'nextActionBanner.s4.body',
  primary: {
    labelKey: 'nextActionBanner.s4.cta.primary',
    action: 'navigate-delivery',
  },
  secondary: {
    labelKey: 'nextActionBanner.s4.cta.secondary',
    action: 'switch-tab-prd',
  },
};

const STATE_S5: NextActionBannerState = {
  stateId: 'S5',
  titleKey: 'nextActionBanner.s5.title',
  bodyKey: 'nextActionBanner.s5.body',
  primary: {
    labelKey: 'nextActionBanner.s5.cta.primary',
    action: 'switch-mode-standard',
  },
  secondary: {
    labelKey: 'nextActionBanner.s5.cta.secondary',
    action: 'switch-tab-prd',
  },
};

export function deriveNextActionBannerState(
  inputs: NextActionBannerInputs
): NextActionBannerState | null {
  if (inputs.loading) return null;

  const {
    journeyMode,
    prdVersionCount,
    questionHistoryCount,
    hasActiveShareLinkOnLatestPrd,
  } = inputs;

  // S5 override — express mode locks post-PRD; share-first guidance kicks in
  // only once a PRD exists. Before that, fall through to S1/S2.
  if (journeyMode === 'express' && prdVersionCount > 0) {
    return STATE_S5;
  }

  if (prdVersionCount === 0) {
    return questionHistoryCount > 0 ? STATE_S2 : STATE_S1;
  }

  if (!hasActiveShareLinkOnLatestPrd) {
    return STATE_S3;
  }

  // PRD + active share + standard mode → push toward delivery handoff.
  if (journeyMode === 'standard') {
    return STATE_S4;
  }

  // S6 (builder export completed) is intentionally not detected in v1 — no
  // persistent backend signal exists. Hide the banner instead of guessing.
  return null;
}
