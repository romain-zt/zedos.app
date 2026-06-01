import { z } from 'zod';

export const ProjectMemberRoleSchema = z.enum(['owner', 'editor', 'viewer']);
export const ProjectMemberStatusSchema = z.enum(['pending', 'active']);

export const ProjectMemberDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  userId: z.string().nullable(),
  inviteEmail: z.string().email(),
  role: ProjectMemberRoleSchema,
  status: ProjectMemberStatusSchema,
  createdAt: z.coerce.date(),
  acceptedAt: z.coerce.date().nullable(),
});

export type ProjectMemberDTO = z.infer<typeof ProjectMemberDTOSchema>;

export const ProjectMemberListResponseSchema = z.object({
  members: z.array(ProjectMemberDTOSchema),
});

export const InviteProjectMemberRequestSchema = z.object({
  inviteEmail: z.string().email(),
  role: ProjectMemberRoleSchema.exclude(['owner']).default('viewer'),
});

export type InviteProjectMemberRequest = z.infer<typeof InviteProjectMemberRequestSchema>;
