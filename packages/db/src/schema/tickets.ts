import { pgTable, text, integer, timestamp, date, unique, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';

/**
 * Delivery milestones (planning / calendar). Tickets attach to milestones.
 */
export const milestones = pgTable(
  'milestones',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    startsOn: date('starts_on'),
    dueOn: date('due_on'),
    color: text('color'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [index('milestones_project_id_idx').on(t.projectId, t.sortOrder)]
);

/**
 * Project tickets (Kanban board). Seeded from task-split tasks / user stories
 * by the engineering manager agent, fully human-editable afterwards.
 */
export const tickets = pgTable(
  'tickets',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    /** Per-project sequential number (ZED-<number>). */
    number: integer('number').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: text('status').notNull().default('backlog'),
    priority: text('priority').notNull().default('medium'),
    estimate: integer('estimate'),
    assigneeRole: text('assignee_role'),
    /** Optional provenance links — FKs enforced in migration SQL to avoid circular imports. */
    userStoryLineId: text('user_story_line_id'),
    taskSplitTaskId: text('task_split_task_id'),
    milestoneId: text('milestone_id').references(() => milestones.id, { onDelete: 'set null' }),
    dueDate: date('due_date'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [
    unique('tickets_project_number_unique').on(t.projectId, t.number),
    unique('tickets_task_split_task_unique').on(t.taskSplitTaskId),
    index('tickets_project_status_idx').on(t.projectId, t.status, t.sortOrder),
    index('tickets_project_milestone_idx').on(t.projectId, t.milestoneId),
    index('tickets_project_due_idx').on(t.projectId, t.dueDate),
  ]
);

export type MilestoneRow = typeof milestones.$inferSelect;
export type MilestoneInsertRow = typeof milestones.$inferInsert;
export type TicketRow = typeof tickets.$inferSelect;
export type TicketInsertRow = typeof tickets.$inferInsert;
