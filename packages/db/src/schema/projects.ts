import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { users } from './users';

export const projects = pgTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  phase: text('phase').notNull().default('intake'),
  journeyMode: text('journey_mode').notNull().default('standard'),
  architectureStartedAt: timestamp('architecture_started_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (t) => [index('projects_user_id_idx').on(t.userId)]);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
