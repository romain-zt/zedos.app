import { pgTable, text, integer, timestamp, json, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';
import { prdVersions } from './prd-versions';
import { users } from './users';

/**
 * Adversarial PRD red-team review reports.
 *
 * `status`: 'pending' | 'completed' | 'failed' | 'empty'
 * `findings` row count is denormalized for fast list view.
 */
export const redTeamReports = pgTable(
  'red_team_reports',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    prdVersionId: text('prd_version_id')
      .notNull()
      .references(() => prdVersions.id, { onDelete: 'cascade' }),
    requestedByUserId: text('requested_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    creditCost: integer('credit_cost').notNull(),
    findingCount: integer('finding_count').notNull().default(0),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (t) => [
    index('red_team_reports_project_id_idx').on(t.projectId),
    index('red_team_reports_prd_version_id_idx').on(t.prdVersionId),
    index('red_team_reports_status_idx').on(t.status),
  ],
);

export const redTeamFindings = pgTable(
  'red_team_findings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    reportId: text('report_id')
      .notNull()
      .references(() => redTeamReports.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
    category: text('category').notNull(),
    severity: text('severity').notNull(),
    sectionId: text('section_id'),
    title: text('title').notNull(),
    evidence: text('evidence').notNull(),
    suggestion: text('suggestion').notNull(),
    metadata: json('metadata').$type<Record<string, string>>().notNull().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('red_team_findings_report_id_idx').on(t.reportId, t.sortOrder),
    index('red_team_findings_section_id_idx').on(t.sectionId),
  ],
);

export type RedTeamReportRow = typeof redTeamReports.$inferSelect;
export type RedTeamFindingRow = typeof redTeamFindings.$inferSelect;
