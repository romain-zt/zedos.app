import { z } from 'zod';

export const CommentThreadStatusSchema = z.enum(['open', 'resolved']);
export type CommentThreadStatus = z.infer<typeof CommentThreadStatusSchema>;

export const CommentAuthorRoleSchema = z.enum(['owner', 'commenter']);
export type CommentAuthorRole = z.infer<typeof CommentAuthorRoleSchema>;

export const CommentMessageDTOSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  authorUserId: z.string(),
  authorRole: CommentAuthorRoleSchema,
  authorEmail: z.string().nullable(),
  body: z.string(),
  createdAt: z.coerce.date(),
});

export type CommentMessageDTO = z.infer<typeof CommentMessageDTOSchema>;

export const CommentThreadDTOSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  prdVersionId: z.string().nullable(),
  sectionId: z.string(),
  status: CommentThreadStatusSchema,
  createdByUserId: z.string(),
  createdAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
  ownerLastReadAt: z.coerce.date().nullable(),
  messageCount: z.number().int().min(0),
  lastMessageAt: z.coerce.date().nullable(),
  unreadByOwner: z.boolean(),
  messages: z.array(CommentMessageDTOSchema),
});

export type CommentThreadDTO = z.infer<typeof CommentThreadDTOSchema>;

/** GET /api/projects/:id/threads?prdVersionId=...&sectionId=...&status=... */
export const ListCommentThreadsQuerySchema = z.object({
  prdVersionId: z.string().min(1).optional(),
  sectionId: z.string().min(1).optional(),
  status: CommentThreadStatusSchema.optional(),
});

export type ListCommentThreadsQuery = z.infer<typeof ListCommentThreadsQuerySchema>;

export const ListCommentThreadsResponseSchema = z.object({
  threads: z.array(CommentThreadDTOSchema),
});

export type ListCommentThreadsResponse = z.infer<typeof ListCommentThreadsResponseSchema>;

/** POST /api/projects/:id/threads — creates a thread + first message (or appends if a thread for that section already exists). */
export const PostSectionCommentRequestSchema = z.object({
  prdVersionId: z.string().min(1).nullable(),
  sectionId: z.string().min(1),
  body: z.string().min(1).max(4000),
});

export type PostSectionCommentRequest = z.infer<typeof PostSectionCommentRequestSchema>;

/** POST /api/projects/:id/threads/:threadId/messages — append message to existing thread. */
export const PostThreadMessageRequestSchema = z.object({
  body: z.string().min(1).max(4000),
});

export type PostThreadMessageRequest = z.infer<typeof PostThreadMessageRequestSchema>;

/** POST /api/projects/:id/threads/:threadId/resolve — owner toggles status. */
export const ResolveThreadRequestSchema = z.object({
  status: CommentThreadStatusSchema,
});

export type ResolveThreadRequest = z.infer<typeof ResolveThreadRequestSchema>;
