import { pgTable, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';
import { users } from './users';

export const githubConnectionStatuses = ['active', 'disconnected', 'token_invalid'] as const;
export type GithubConnectionStatus = (typeof githubConnectionStatuses)[number];

export const githubConnections = pgTable(
  'github_connections',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    connectedByUserId: text('connected_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ownerLogin: text('owner_login').notNull(),
    repoName: text('repo_name').notNull(),
    installationId: text('installation_id'),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    disconnectedAt: timestamp('disconnected_at'),
  },
  (t) => [
    uniqueIndex('github_connections_project_id_uidx').on(t.projectId),
    index('github_connections_repo_idx').on(t.ownerLogin, t.repoName),
  ],
);

export type GithubConnectionRow = typeof githubConnections.$inferSelect;
