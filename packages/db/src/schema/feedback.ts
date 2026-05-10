import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { users } from './users';
import { projects } from './projects';
import { prdVersions } from './prd-versions';

export const milestoneFeedback = pgTable('milestone_feedback', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  prdVersionId: text('prd_version_id').references(() => prdVersions.id, { onDelete: 'set null' }),
  milestoneType: text('milestone_type').notNull(),
  ratingType: text('rating_type').notNull().default('stars'),
  ratingValue: integer('rating_value'),
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [index('milestone_feedback_user_milestone_idx').on(t.userId, t.milestoneType)]);

export type MilestoneFeedback = typeof milestoneFeedback.$inferSelect;
export type NewMilestoneFeedback = typeof milestoneFeedback.$inferInsert;
