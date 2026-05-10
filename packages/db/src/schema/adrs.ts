import { pgTable, text, integer, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';

export const adrs = pgTable('adrs', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  adrNumber: integer('adr_number').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (t) => [
  unique('adrs_project_adr_number_unique').on(t.projectId, t.adrNumber),
  index('adrs_project_id_idx').on(t.projectId),
]);

export type Adr = typeof adrs.$inferSelect;
export type NewAdr = typeof adrs.$inferInsert;
