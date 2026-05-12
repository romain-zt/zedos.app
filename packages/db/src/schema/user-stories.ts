import { pgTable, text, integer, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';
import { featureSplitClusters } from './feature-split';

export const userStoryCorpora = pgTable(
  'user_story_corpora',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    featureSplitClusterId: text('feature_split_cluster_id')
      .notNull()
      .references(() => featureSplitClusters.id, { onDelete: 'cascade' }),
    reviewReadyAt: timestamp('review_ready_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
  },
  (t) => [
    unique('user_story_corpora_cluster_unique').on(t.featureSplitClusterId),
    index('user_story_corpora_project_id_idx').on(t.projectId),
  ]
);

export const userStoryLines = pgTable(
  'user_story_lines',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    corpusId: text('corpus_id')
      .notNull()
      .references(() => userStoryCorpora.id, { onDelete: 'cascade' }),
    sortOrder: integer('sort_order').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    archivedAt: timestamp('archived_at'),
    draftMarker: text('draft_marker'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
  },
  (t) => [
    index('user_story_lines_corpus_id_idx').on(t.corpusId),
    index('user_story_lines_corpus_sort_idx').on(t.corpusId, t.sortOrder),
  ]
);

export type UserStoryCorpus = typeof userStoryCorpora.$inferSelect;
export type NewUserStoryCorpus = typeof userStoryCorpora.$inferInsert;
export type UserStoryLine = typeof userStoryLines.$inferSelect;
export type NewUserStoryLine = typeof userStoryLines.$inferInsert;
