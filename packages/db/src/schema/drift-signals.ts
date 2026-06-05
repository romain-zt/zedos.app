import { pgTable, text, json, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';

export const driftSignalSources = ['webhook', 'scheduled', 'backfill'] as const;
export type DriftSignalSource = (typeof driftSignalSources)[number];

export const driftSignalKinds = [
  'DRIFT-01',
  'DRIFT-02',
  'DRIFT-03',
  'DRIFT-04',
] as const;
export type DriftSignalKind = (typeof driftSignalKinds)[number];

export const driftSignalSeverities = ['info', 'warn', 'critical'] as const;
export type DriftSignalSeverity = (typeof driftSignalSeverities)[number];

export const driftSignalStatuses = ['open', 'resolved', 'dismissed'] as const;
export type DriftSignalStatus = (typeof driftSignalStatuses)[number];

export const driftSignals = pgTable(
  'drift_signals',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    severity: text('severity').notNull().default('info'),
    summary: text('summary').notNull(),
    payload: json('payload').$type<Record<string, unknown>>().notNull().default({}),
    source: text('source').notNull(),
    /** Idempotency key — for webhooks: X-GitHub-Delivery; for scheduled jobs: synthetic. */
    externalDeliveryId: text('external_delivery_id').notNull(),
    status: text('status').notNull().default('open'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at'),
    dismissedAt: timestamp('dismissed_at'),
  },
  (t) => [
    uniqueIndex('drift_signals_project_delivery_uidx').on(t.projectId, t.externalDeliveryId),
    index('drift_signals_project_status_idx').on(t.projectId, t.status),
    index('drift_signals_project_created_idx').on(t.projectId, t.createdAt),
  ],
);

export type DriftSignalRow = typeof driftSignals.$inferSelect;
