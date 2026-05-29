import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';

export const taskSplitBundles = pgTable(
  'task_split_bundles',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    /** Optional stable key linking to a user story line (nullable until corpus FK exists). */
    sourceUserStoryKey: text('source_user_story_key'),
    /** Denormalized snapshot of story title at bundle creation time. */
    storyTitleSnapshot: text('story_title_snapshot'),
    lockedAt: timestamp('locked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    index('task_split_bundles_project_id_idx').on(t.projectId),
  ]
);

export const taskSplitTasks = pgTable(
  'task_split_tasks',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    bundleId: text('bundle_id')
      .notNull()
      .references(() => taskSplitBundles.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
    title: text('title').notNull(),
    promptBody: text('prompt_body').notNull(),
    manual: boolean('manual').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    index('task_split_tasks_bundle_id_idx').on(t.bundleId),
    index('task_split_tasks_bundle_sort_idx').on(t.bundleId, t.sortOrder),
  ]
);

export type TaskSplitBundle = typeof taskSplitBundles.$inferSelect;
export type NewTaskSplitBundle = typeof taskSplitBundles.$inferInsert;
export type TaskSplitTask = typeof taskSplitTasks.$inferSelect;
export type NewTaskSplitTask = typeof taskSplitTasks.$inferInsert;
