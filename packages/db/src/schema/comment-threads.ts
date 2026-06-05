import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';
import { prdVersions } from './prd-versions';
import { users } from './users';

export const commentThreadStatuses = ['open', 'resolved'] as const;
export type CommentThreadStatus = (typeof commentThreadStatuses)[number];

export const projectCommentThreads = pgTable(
  'project_comment_threads',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    prdVersionId: text('prd_version_id').references(() => prdVersions.id, {
      onDelete: 'set null',
    }),
    sectionId: text('section_id').notNull(),
    status: text('status').notNull().default('open'),
    createdByUserId: text('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    ownerLastReadAt: timestamp('owner_last_read_at'),
  },
  (t) => [
    index('project_comment_threads_project_section_idx').on(t.projectId, t.sectionId),
    index('project_comment_threads_project_status_idx').on(t.projectId, t.status),
    index('project_comment_threads_prd_version_idx').on(t.prdVersionId),
  ],
);

export const projectCommentMessages = pgTable(
  'project_comment_messages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    threadId: text('thread_id')
      .notNull()
      .references(() => projectCommentThreads.id, { onDelete: 'cascade' }),
    authorUserId: text('author_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('project_comment_messages_thread_id_idx').on(t.threadId, t.createdAt),
  ],
);

export type ProjectCommentThreadRow = typeof projectCommentThreads.$inferSelect;
export type ProjectCommentMessageRow = typeof projectCommentMessages.$inferSelect;
