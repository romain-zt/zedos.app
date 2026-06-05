import { pgTable, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';
import { userStoryLines } from './user-stories';

export const linearIssueLinkStatuses = ['triage', 'backlog', 'todo', 'in_progress', 'done', 'canceled', 'unknown'] as const;
export type LinearIssueLinkStatus = (typeof linearIssueLinkStatuses)[number];

export const linearIssueLinks = pgTable(
  'linear_issue_links',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    userStoryLineId: text('user_story_line_id')
      .notNull()
      .references(() => userStoryLines.id, { onDelete: 'cascade' }),
    linearIssueId: text('linear_issue_id').notNull(),
    linearIssueIdentifier: text('linear_issue_identifier').notNull(),
    status: text('status').notNull().default('unknown'),
    lastSyncedAt: timestamp('last_synced_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('linear_issue_links_user_story_line_uidx').on(t.userStoryLineId),
    index('linear_issue_links_project_id_idx').on(t.projectId),
    index('linear_issue_links_issue_id_idx').on(t.linearIssueId),
  ],
);

export type LinearIssueLinkRow = typeof linearIssueLinks.$inferSelect;
