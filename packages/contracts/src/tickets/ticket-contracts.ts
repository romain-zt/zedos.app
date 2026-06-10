import { z } from 'zod';
import { AgentRoleSchema } from '../team/team-contracts';

export const TICKET_STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done'] as const;
export const TicketStatusSchema = z.enum(TICKET_STATUSES);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const TicketPrioritySchema = z.enum(TICKET_PRIORITIES);
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

/** ISO `yyyy-mm-dd` calendar date (Postgres `date` column). */
export const CalendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const TicketDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  number: z.number().int().positive(),
  key: z.string(), // e.g. ZED-12
  title: z.string(),
  description: z.string(),
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  estimate: z.number().int().min(0).nullable(),
  assigneeRole: AgentRoleSchema.nullable(),
  userStoryLineId: z.string().nullable(),
  taskSplitTaskId: z.string().nullable(),
  milestoneId: z.string().nullable(),
  dueDate: CalendarDateSchema.nullable(),
  sortOrder: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TicketDTO = z.infer<typeof TicketDTOSchema>;

export const TicketListResponseSchema = z.object({
  tickets: z.array(TicketDTOSchema),
});
export type TicketListResponse = z.infer<typeof TicketListResponseSchema>;

export const CreateTicketRequestSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(20_000).optional(),
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  estimate: z.number().int().min(0).max(100).nullable().optional(),
  assigneeRole: AgentRoleSchema.nullable().optional(),
  milestoneId: z.string().nullable().optional(),
  dueDate: CalendarDateSchema.nullable().optional(),
});
export type CreateTicketRequest = z.infer<typeof CreateTicketRequestSchema>;

export const UpdateTicketRequestSchema = z
  .object({
    title: z.string().min(1).max(500),
    description: z.string().max(20_000),
    status: TicketStatusSchema,
    priority: TicketPrioritySchema,
    estimate: z.number().int().min(0).max(100).nullable(),
    assigneeRole: AgentRoleSchema.nullable(),
    milestoneId: z.string().nullable(),
    dueDate: CalendarDateSchema.nullable(),
    sortOrder: z.number().int().min(0),
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: 'No fields to update' });
export type UpdateTicketRequest = z.infer<typeof UpdateTicketRequestSchema>;

export const GenerateTicketsResponseSchema = z.object({
  created: z.number().int().min(0),
  skipped: z.number().int().min(0),
  tickets: z.array(TicketDTOSchema),
});
export type GenerateTicketsResponse = z.infer<typeof GenerateTicketsResponseSchema>;
