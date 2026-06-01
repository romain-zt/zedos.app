import { pgTable, text, integer, timestamp, boolean, unique, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';

export const taskSplitBundles = pgTable(
  'task_split_bundles',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    /** FK to user_story_lines enforced in migration SQL (avoids schema circular import). */
    userStoryLineId: text('user_story_line_id'),
    storyTitle: text('story_title'),
    storyBody: text('story_body'),
    lockedAt: timestamp('locked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    unique('task_split_bundles_project_story_line_unique').on(t.projectId, t.userStoryLineId),
    index('task_split_bundles_project_id_idx').on(t.projectId),
    index('task_split_bundles_locked_at_idx').on(t.projectId, t.lockedAt),
  ]
);

export const taskSplitTasks = pgTable(
  'task_split_tasks',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    /** FK to task_split_bundles enforced in migration SQL. */
    bundleId: text('bundle_id').notNull(),
    sortOrder: integer('sort_order').notNull(),
    title: text('title').notNull(),
    promptBody: text('prompt_body').notNull(),
    manual: boolean('manual').notNull().default(false),
    deletedAt: timestamp('deleted_at'),
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
