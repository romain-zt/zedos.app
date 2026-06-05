/**
 * Domain types for the templates marketplace.
 *
 * Pure domain — no Zod import, no application/infrastructure deps. The
 * application layer maps these to/from the cross-layer DTOs defined in
 * `@repo/contracts/templates`.
 */

import type {
  TemplateAuthor,
  TemplateCategory,
  TemplateJourneyHint,
  TemplateSlug,
} from '@repo/contracts/templates';
import type { GeneratePrdAiResponse } from '@repo/contracts/ai/generate-prd-stream';

export interface TemplateSectionsOutlineEntry {
  id: string;
  title: string;
}

export interface TemplateSummary {
  slug: TemplateSlug;
  title: string;
  description: string;
  category: TemplateCategory;
  journeyHint: TemplateJourneyHint;
  sector: string;
  author: TemplateAuthor;
  forkCount: number;
}

export interface TemplateDetail extends TemplateSummary {
  sectionsOutline: TemplateSectionsOutlineEntry[];
  clarifyHints: string[];
  /** Seed PRD body — shape matches `GeneratePrdAiResponseSchema`. */
  content: GeneratePrdAiResponse;
}
