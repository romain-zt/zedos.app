import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';
import { users } from './users';

export const linearConnectionStatuses = ['active', 'disconnected', 'token_invalid'] as const;
export type LinearConnectionStatus = (typeof linearConnectionStatuses)[number];

export const linearConnections = pgTable(
  'linear_connections',
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
    teamId: text('team_id').notNull(),
    linearProjectId: text('linear_project_id'),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    disconnectedAt: timestamp('disconnected_at'),
  },
  (t) => [uniqueIndex('linear_connections_project_id_uidx').on(t.projectId)],
);

export type LinearConnectionRow = typeof linearConnections.$inferSelect;
