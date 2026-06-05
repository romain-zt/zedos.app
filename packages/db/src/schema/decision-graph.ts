import { pgTable, text, json, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';
import { prdVersions } from './prd-versions';
import { questionHistory } from './question-history';

export const decisions = pgTable(
  'decisions',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    prdVersionId: text('prd_version_id').references(() => prdVersions.id, {
      onDelete: 'set null',
    }),
    questionHistoryId: text('question_history_id')
      .notNull()
      .references(() => questionHistory.id, { onDelete: 'cascade' }),
    structuredQuestion: text('structured_question').notNull(),
    chosenOption: text('chosen_option'),
    rejectedOptions: json('rejected_options').$type<string[]>().notNull().default([]),
    ownerComment: text('owner_comment'),
    aiInterpretation: text('ai_interpretation'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('decisions_question_history_id_uidx').on(t.questionHistoryId),
    index('decisions_project_id_idx').on(t.projectId),
    index('decisions_prd_version_id_idx').on(t.prdVersionId),
  ],
);

export const decisionLinks = pgTable(
  'decision_links',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    decisionId: text('decision_id')
      .notNull()
      .references(() => decisions.id, { onDelete: 'cascade' }),
    sectionId: text('section_id').notNull(),
    anchor: text('anchor'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('decision_links_decision_id_idx').on(t.decisionId),
    index('decision_links_section_id_idx').on(t.sectionId),
  ],
);

export type DecisionRow = typeof decisions.$inferSelect;
export type DecisionLinkRow = typeof decisionLinks.$inferSelect;
