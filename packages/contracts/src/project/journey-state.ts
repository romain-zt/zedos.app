import { z } from 'zod';

export const JOURNEY_STEPS = [
  'idea',
  'clarify',
  'prd',
  'features',
  'stories',
  'tickets',
  'plan',
  'ship',
] as const;

export const JourneyStepSchema = z.enum(JOURNEY_STEPS);
export type JourneyStep = z.infer<typeof JourneyStepSchema>;

/** Raw per-project journey counters — the stepper derives step states from these. */
export const JourneyStateDTOSchema = z.object({
  projectId: z.string(),
  journeyMode: z.enum(['standard', 'express']),
  questionCount: z.number().int().min(0),
  prdVersionCount: z.number().int().min(0),
  /** True when at least one PRD version has real content (generated or edited). */
  hasGeneratedPrd: z.boolean(),
  featureSplitConfirmed: z.boolean(),
  storyLineCount: z.number().int().min(0),
  lockedBundleCount: z.number().int().min(0),
  ticketCount: z.number().int().min(0),
  doneTicketCount: z.number().int().min(0),
  milestoneCount: z.number().int().min(0),
});

export type JourneyStateDTO = z.infer<typeof JourneyStateDTOSchema>;
