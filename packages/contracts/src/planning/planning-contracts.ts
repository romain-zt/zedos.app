import { z } from 'zod';
import { CalendarDateSchema, TicketDTOSchema } from '../tickets/ticket-contracts';

export const MilestoneDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startsOn: CalendarDateSchema.nullable(),
  dueOn: CalendarDateSchema.nullable(),
  color: z.string().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type MilestoneDTO = z.infer<typeof MilestoneDTOSchema>;

export const MilestoneListResponseSchema = z.object({
  milestones: z.array(MilestoneDTOSchema),
});
export type MilestoneListResponse = z.infer<typeof MilestoneListResponseSchema>;

export const CreateMilestoneRequestSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).nullable().optional(),
  startsOn: CalendarDateSchema.nullable().optional(),
  dueOn: CalendarDateSchema.nullable().optional(),
  color: z.string().max(50).nullable().optional(),
});
export type CreateMilestoneRequest = z.infer<typeof CreateMilestoneRequestSchema>;

export const UpdateMilestoneRequestSchema = z
  .object({
    title: z.string().min(1).max(300),
    description: z.string().max(5000).nullable(),
    startsOn: CalendarDateSchema.nullable(),
    dueOn: CalendarDateSchema.nullable(),
    color: z.string().max(50).nullable(),
    sortOrder: z.number().int().min(0),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'No fields to update' });
export type UpdateMilestoneRequest = z.infer<typeof UpdateMilestoneRequestSchema>;

export const GeneratePlanResponseSchema = z.object({
  milestones: z.array(MilestoneDTOSchema),
  tickets: z.array(TicketDTOSchema),
});
export type GeneratePlanResponse = z.infer<typeof GeneratePlanResponseSchema>;
