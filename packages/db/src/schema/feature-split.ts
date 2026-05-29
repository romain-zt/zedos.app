import { pgTable, text, integer, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';
import { prdVersions } from './prd-versions';

export const featureSplits = pgTable('feature_splits', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sourcePrdVersionId: text('source_prd_version_id')
    .notNull()
    .references(() => prdVersions.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  unique('feature_splits_project_prd_version_unique').on(t.projectId, t.sourcePrdVersionId),
  index('feature_splits_project_id_idx').on(t.projectId),
  index('feature_splits_source_prd_version_id_idx').on(t.sourcePrdVersionId),
]);

export const featureSplitClusters = pgTable('feature_split_clusters', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  featureSplitId: text('feature_split_id')
    .notNull()
    .references(() => featureSplits.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull(),
  label: text('label').notNull(),
  valueLine: text('value_line').notNull(),
  boundaryCue: text('boundary_cue').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
}, (t) => [
  index('feature_split_clusters_feature_split_id_idx').on(t.featureSplitId),
  index('feature_split_clusters_split_sort_idx').on(t.featureSplitId, t.sortOrder),
]);

export type FeatureSplit = typeof featureSplits.$inferSelect;
export type NewFeatureSplit = typeof featureSplits.$inferInsert;
export type FeatureSplitCluster = typeof featureSplitClusters.$inferSelect;
export type NewFeatureSplitCluster = typeof featureSplitClusters.$inferInsert;
