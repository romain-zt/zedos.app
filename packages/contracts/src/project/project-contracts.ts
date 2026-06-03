/**
 * Project Contracts
 *
 * Zod schemas for project requests, responses, and DTOs.
 * Single source of truth for validation across API boundaries.
 */

import { z } from 'zod';
import { PrdVersionContentSchema } from '../prd/prd-contracts';

export const JourneyModeSchema = z.enum(['standard', 'express']);

export type JourneyMode = z.infer<typeof JourneyModeSchema>;

export const CreateProjectRequestSchema = z.object({
  name: z.string().min(1, 'Project name is required').transform((v) => v.trim()),
  description: z.string().optional().nullable().transform((v) => v?.trim() ?? null),
  journeyMode: JourneyModeSchema.optional().default('standard'),
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const UpdateProjectRequestSchema = z.object({
  name: z.string().min(1).transform((v) => v.trim()).optional(),
  description: z.string().optional().nullable().transform((v) => v?.trim() ?? null),
});

export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;

export const UpdateProjectJourneyModeRequestSchema = z.object({
  journeyMode: JourneyModeSchema,
});

export type UpdateProjectJourneyModeRequest = z.infer<typeof UpdateProjectJourneyModeRequestSchema>;

export const ProjectDTOSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  phase: z.string(),
  journeyMode: JourneyModeSchema,
  architectureStartedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProjectDTO = z.infer<typeof ProjectDTOSchema>;

export const ProjectListItemDTOSchema = ProjectDTOSchema.extend({
  latestPrdVersion: z.object({
    versionNumber: z.number(),
    content: PrdVersionContentSchema,
  }).nullable().optional(),
  prdVersionCount: z.number(),
  questionHistoryCount: z.number(),
});

export type ProjectListItemDTO = z.infer<typeof ProjectListItemDTOSchema>;
