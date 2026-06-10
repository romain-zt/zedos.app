import type { JourneyStateDTO, JourneyStep } from '@repo/contracts/project';

export type JourneyStepStatus = 'done' | 'current' | 'upcoming' | 'locked';

export interface DerivedJourneyStep {
  step: JourneyStep;
  status: JourneyStepStatus;
}

const EXPRESS_LOCKED_STEPS: ReadonlySet<JourneyStep> = new Set([
  'features',
  'stories',
  'tickets',
  'plan',
  'ship',
]);

/**
 * Pure: derives the 8-step journey from raw project counters.
 * - first not-done unlocked step becomes `current`
 * - express mode locks every post-PRD step
 */
export function deriveJourneySteps(state: JourneyStateDTO): DerivedJourneyStep[] {
  const doneByStep: Record<JourneyStep, boolean> = {
    idea: true,
    clarify: state.questionCount > 0,
    prd: state.hasGeneratedPrd,
    features: state.featureSplitConfirmed,
    stories: state.storyLineCount > 0,
    tickets: state.ticketCount > 0,
    plan: state.milestoneCount > 0,
    ship: state.lockedBundleCount > 0,
  };

  const isExpress = state.journeyMode === 'express';
  let currentAssigned = false;

  return (Object.keys(doneByStep) as JourneyStep[]).map((step) => {
    if (isExpress && EXPRESS_LOCKED_STEPS.has(step)) {
      return { step, status: 'locked' as const };
    }
    if (doneByStep[step]) {
      return { step, status: 'done' as const };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { step, status: 'current' as const };
    }
    return { step, status: 'upcoming' as const };
  });
}

/** Workspace path for each step, relative to /dashboard. */
export function journeyStepHref(projectId: string, step: JourneyStep): string {
  const base = `/dashboard/projects/${projectId}`;
  switch (step) {
    case 'idea':
    case 'clarify':
      return base;
    case 'prd':
      return `${base}?tab=prd`;
    case 'features':
      return `${base}/feature-split`;
    case 'stories':
      return `${base}/user-stories`;
    case 'tickets':
      return `${base}/board`;
    case 'plan':
      return `${base}/plan`;
    case 'ship':
      return `${base}/delivery`;
  }
}
