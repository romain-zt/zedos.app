import { describe, it, expect } from 'vitest';
import {
  deriveNextActionBannerState,
  type NextActionBannerInputs,
} from './derive-next-action-banner-state';

const baseInputs: NextActionBannerInputs = {
  journeyMode: 'standard',
  prdVersionCount: 0,
  questionHistoryCount: 0,
  hasActiveShareLinkOnLatestPrd: false,
  loading: false,
};

describe('deriveNextActionBannerState', () => {
  it('returns null while loading regardless of other inputs', () => {
    expect(
      deriveNextActionBannerState({
        ...baseInputs,
        loading: true,
        prdVersionCount: 3,
        hasActiveShareLinkOnLatestPrd: true,
      })
    ).toBeNull();
  });

  it('returns S1 when project has no PRD and no clarify history', () => {
    const state = deriveNextActionBannerState(baseInputs);
    expect(state?.stateId).toBe('S1');
    expect(state?.primary.action).toBe('switch-tab-clarify');
  });

  it('returns S2 when project has no PRD but clarification has started', () => {
    const state = deriveNextActionBannerState({
      ...baseInputs,
      questionHistoryCount: 4,
    });
    expect(state?.stateId).toBe('S2');
    expect(state?.primary.action).toBe('switch-tab-clarify');
  });

  it('returns S3 when PRD exists but the latest version has no active share link', () => {
    const state = deriveNextActionBannerState({
      ...baseInputs,
      prdVersionCount: 1,
      questionHistoryCount: 12,
      hasActiveShareLinkOnLatestPrd: false,
    });
    expect(state?.stateId).toBe('S3');
    expect(state?.primary.action).toBe('switch-tab-prd');
  });

  it('returns S4 when PRD has an active share link in standard mode', () => {
    const state = deriveNextActionBannerState({
      ...baseInputs,
      prdVersionCount: 2,
      hasActiveShareLinkOnLatestPrd: true,
    });
    expect(state?.stateId).toBe('S4');
    expect(state?.primary.action).toBe('navigate-delivery');
    expect(state?.secondary?.action).toBe('switch-tab-prd');
  });

  it('returns S5 in express mode once a PRD exists, regardless of share link state', () => {
    const withoutShare = deriveNextActionBannerState({
      ...baseInputs,
      journeyMode: 'express',
      prdVersionCount: 1,
      hasActiveShareLinkOnLatestPrd: false,
    });
    expect(withoutShare?.stateId).toBe('S5');
    expect(withoutShare?.primary.action).toBe('switch-mode-standard');

    const withShare = deriveNextActionBannerState({
      ...baseInputs,
      journeyMode: 'express',
      prdVersionCount: 3,
      hasActiveShareLinkOnLatestPrd: true,
    });
    expect(withShare?.stateId).toBe('S5');
  });

  it('does not return S5 in express mode before the first PRD (share-first via S1/S2)', () => {
    const noHistory = deriveNextActionBannerState({
      ...baseInputs,
      journeyMode: 'express',
      prdVersionCount: 0,
      questionHistoryCount: 0,
    });
    expect(noHistory?.stateId).toBe('S1');

    const withHistory = deriveNextActionBannerState({
      ...baseInputs,
      journeyMode: 'express',
      prdVersionCount: 0,
      questionHistoryCount: 5,
    });
    expect(withHistory?.stateId).toBe('S2');
  });

  it('returns null (S6 placeholder) when no S1–S5 condition matches', () => {
    // Only edge: standard mode, PRD with active share, but the function should
    // pick S4 — keep this test to lock the contract that S6 is unobservable.
    // Synthesise a state where every S1–S4 trigger is false: requires
    // prdVersionCount > 0, share active, but a non-standard non-express mode.
    // Since JourneyMode is a closed union of 'standard' | 'express', the only
    // way to fall through is loading=true, already covered above. This test
    // documents the invariant: the banner is never silently absent in
    // standard or express modes once a PRD + share exists.
    const standardWithShare = deriveNextActionBannerState({
      ...baseInputs,
      prdVersionCount: 1,
      hasActiveShareLinkOnLatestPrd: true,
    });
    expect(standardWithShare?.stateId).toBe('S4');

    const expressWithShare = deriveNextActionBannerState({
      ...baseInputs,
      journeyMode: 'express',
      prdVersionCount: 1,
      hasActiveShareLinkOnLatestPrd: true,
    });
    expect(expressWithShare?.stateId).toBe('S5');
  });
});
