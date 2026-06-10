import { describe, it, expect } from 'vitest';
import type { JourneyStateDTO } from '@repo/contracts/project';
import { deriveJourneySteps, journeyStepHref } from './derive-journey-steps';

function state(overrides: Partial<JourneyStateDTO> = {}): JourneyStateDTO {
  return {
    projectId: 'p1',
    journeyMode: 'standard',
    questionCount: 0,
    prdVersionCount: 0,
    hasGeneratedPrd: false,
    featureSplitConfirmed: false,
    storyLineCount: 0,
    lockedBundleCount: 0,
    ticketCount: 0,
    doneTicketCount: 0,
    milestoneCount: 0,
    ...overrides,
  };
}

describe('deriveJourneySteps', () => {
  it('starts a fresh project at the clarify step', () => {
    const steps = deriveJourneySteps(state());
    expect(steps[0]).toEqual({ step: 'idea', status: 'done' });
    expect(steps[1]).toEqual({ step: 'clarify', status: 'current' });
    expect(steps[2].status).toBe('upcoming');
  });

  it('advances current to the first incomplete step', () => {
    const steps = deriveJourneySteps(
      state({ questionCount: 3, hasGeneratedPrd: true, featureSplitConfirmed: true }),
    );
    const current = steps.find((s) => s.status === 'current');
    expect(current?.step).toBe('stories');
    expect(steps.filter((s) => s.status === 'done').map((s) => s.step)).toEqual([
      'idea',
      'clarify',
      'prd',
      'features',
    ]);
  });

  it('locks post-PRD steps in express mode', () => {
    const steps = deriveJourneySteps(
      state({ journeyMode: 'express', questionCount: 2, hasGeneratedPrd: true }),
    );
    expect(steps.find((s) => s.step === 'features')?.status).toBe('locked');
    expect(steps.find((s) => s.step === 'ship')?.status).toBe('locked');
    // nothing after prd can be current in express
    expect(steps.find((s) => s.status === 'current')).toBeUndefined();
  });

  it('marks ship done when an export-ready bundle exists', () => {
    const steps = deriveJourneySteps(
      state({
        questionCount: 1,
        hasGeneratedPrd: true,
        featureSplitConfirmed: true,
        storyLineCount: 4,
        ticketCount: 6,
        milestoneCount: 2,
        lockedBundleCount: 1,
      }),
    );
    expect(steps.every((s) => s.status === 'done')).toBe(true);
  });
});

describe('journeyStepHref', () => {
  it('deep-links each step', () => {
    expect(journeyStepHref('p1', 'clarify')).toBe('/dashboard/projects/p1');
    expect(journeyStepHref('p1', 'tickets')).toBe('/dashboard/projects/p1/board');
    expect(journeyStepHref('p1', 'plan')).toBe('/dashboard/projects/p1/plan');
    expect(journeyStepHref('p1', 'ship')).toBe('/dashboard/projects/p1/delivery');
  });
});
