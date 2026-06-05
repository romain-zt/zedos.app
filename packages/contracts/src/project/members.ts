import { z } from 'zod';

export const ProjectMemberRoleSchema = z.enum(['owner', 'editor', 'viewer', 'commenter']);
export const ProjectMemberStatusSchema = z.enum(['pending', 'active']);

/** Cap of simultaneously active commenters per project (PD-003 Phase 1 wedge). */
export const COMMENTER_ACTIVE_CAP = 3;

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
  role: ProjectMemberRoleSchema.exclude(['owner']).default('commenter'),
});

export type InviteProjectMemberRequest = z.infer<typeof InviteProjectMemberRequestSchema>;
