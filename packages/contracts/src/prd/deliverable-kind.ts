import { z } from 'zod';

/** Classification of an in-app PRD version (standard 8-section vs express livrable). */
export const PrdDeliverableKindSchema = z.enum(['standard', 'express']);

export type PrdDeliverableKind = z.infer<typeof PrdDeliverableKindSchema>;

/** Section slugs for express livrable generation (12 sections + envelope). */
export const EXPRESS_PRD_SECTION_IDS = [
  'executive_summary',
  'vision',
  'target_users',
  'core_features',
  'user_journeys',
  'technical',
  'success_metrics',
  'business_model',
  'differentiation',
  'timeline',
  'out_of_scope',
  'risks',
] as const;

export type ExpressPrdSectionId = (typeof EXPRESS_PRD_SECTION_IDS)[number];

/** Minimum IA clarify coverage before express “ready to generate” hint. */
export const EXPRESS_MINIMUM_CLARIFY_SECTIONS = [
  'Product Vision',
  'Target Users',
  'Core Features',
] as const satisfies readonly string[];
