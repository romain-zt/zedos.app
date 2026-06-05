/**
 * Templates Marketplace contracts (v1).
 *
 * Single source of truth for the catalog of 10 official seed templates and the
 * DTOs exchanged across the API boundary. Slugs are a literal union so any new
 * official template must be added explicitly here AND in the infrastructure
 * static seed array — a missing slug is a typecheck error, not a runtime bug.
 */

import { z } from 'zod';
import { GeneratePrdAiResponseSchema } from '../ai/generate-prd-stream';

/** Canonical slug list (T01–T10 from `docs/product/templates-marketplace-v1-cadrage.md`). */
export const KNOWN_TEMPLATE_SLUGS = [
  'pitch-tomorrow',
  'b2b-saas-seed',
  'marketplace-two-sided',
  'ai-developer-tool',
  'mobile-consumer-app',
  'investor-dataroom-lite',
  'pivot-this-week',
  'import-chatgpt-cleanup',
  'cursor-handoff-only',
  'fr-pitch-demain',
] as const;

export const TemplateSlugSchema = z.enum(KNOWN_TEMPLATE_SLUGS);
export type TemplateSlug = z.infer<typeof TemplateSlugSchema>;

/** v1 only ships Zedos-authored templates. */
export const TemplateAuthorSchema = z.literal('zedos-official');
export type TemplateAuthor = z.infer<typeof TemplateAuthorSchema>;

/**
 * Catalog category — broader than the project's journey mode because some
 * templates are import-oriented (no project journey mode for that today).
 */
export const TemplateCategorySchema = z.enum([
  'playbook',
  'prd-skeleton',
  'one-pager-pack',
  'import-guide',
  'post-prd',
]);
export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

/**
 * Display hint for the catalog UI. `'import'` is allowed because some
 * templates are import-flow oriented; the project's actual `journeyMode`
 * always resolves to `'standard' | 'express'` when applied.
 */
export const TemplateJourneyHintSchema = z.enum(['standard', 'express', 'import']);
export type TemplateJourneyHint = z.infer<typeof TemplateJourneyHintSchema>;

/** Sector tag used for filtering / display only. */
export const TemplateSectorSchema = z.string().min(1).max(64);

/** Catalog summary (list view). */
export const TemplateSummaryDTOSchema = z.object({
  slug: TemplateSlugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  category: TemplateCategorySchema,
  journeyHint: TemplateJourneyHintSchema,
  sector: TemplateSectorSchema,
  author: TemplateAuthorSchema,
  forkCount: z.number().int().min(0),
});
export type TemplateSummaryDTO = z.infer<typeof TemplateSummaryDTOSchema>;

/** Pre-filled PRD section identifier surfaced in the preview. */
export const TemplateSectionsOutlineEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
});
export type TemplateSectionsOutlineEntry = z.infer<typeof TemplateSectionsOutlineEntrySchema>;

/**
 * Detail (preview + use-template payload).
 *
 * `content` reuses `GeneratePrdAiResponseSchema` so the same body is directly
 * compatible with `PrdVersionContent` consumers (importedPrd flow).
 */
export const TemplateDetailDTOSchema = TemplateSummaryDTOSchema.extend({
  sectionsOutline: z.array(TemplateSectionsOutlineEntrySchema).min(1),
  clarifyHints: z.array(z.string().min(1)),
  content: GeneratePrdAiResponseSchema,
});
export type TemplateDetailDTO = z.infer<typeof TemplateDetailDTOSchema>;

/** GET /api/templates response (deterministic seed order). */
export const TemplateListResponseSchema = z.array(TemplateSummaryDTOSchema);
export type TemplateListResponse = z.infer<typeof TemplateListResponseSchema>;
