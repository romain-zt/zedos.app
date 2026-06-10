import { pgTable, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';

/**
 * Activity feed for the zedos AI engineering team. One row per agent job
 * (running → completed | failed). Powers the project Team panel.
 */
export const agentActivities = pgTable(
  'agent_activities',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    agentRole: text('agent_role').notNull(),
    kind: text('kind').notNull(),
    status: text('status').notNull().default('running'),
    summary: text('summary').notNull(),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('agent_activities_project_created_idx').on(t.projectId, t.createdAt),
    index('agent_activities_project_status_idx').on(t.projectId, t.status),
  ]
);

/**
 * Scout's (talent scout) team & skills recommendation for a project.
 * One row per project, regenerable.
 */
export const teamPlans = pgTable(
  'team_plans',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .unique('team_plans_project_unique')
      .references(() => projects.id, { onDelete: 'cascade' }),
    plan: jsonb('plan').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (t) => [index('team_plans_project_id_idx').on(t.projectId)]
);

export type AgentActivityRow = typeof agentActivities.$inferSelect;
export type AgentActivityInsertRow = typeof agentActivities.$inferInsert;
export type TeamPlanRow = typeof teamPlans.$inferSelect;
export type TeamPlanInsertRow = typeof teamPlans.$inferInsert;
