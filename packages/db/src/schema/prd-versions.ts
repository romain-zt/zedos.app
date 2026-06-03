import { pgTable, text, integer, json, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';

export const prdVersions = pgTable('prd_versions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  content: json('content'),
  status: text('status').notNull().default('draft'),
  deliverableKind: text('deliverable_kind').notNull().default('standard'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (t) => [
  unique('prd_versions_project_version_unique').on(t.projectId, t.versionNumber),
  index('prd_versions_project_id_idx').on(t.projectId),
]);

export type PrdVersion = typeof prdVersions.$inferSelect;
export type NewPrdVersion = typeof prdVersions.$inferInsert;
