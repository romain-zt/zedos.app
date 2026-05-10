import { pgTable, text, json, timestamp, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { projects } from './projects';
import { prdVersions } from './prd-versions';

export const questionHistory = pgTable('question_history', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  prdVersionId: text('prd_version_id').references(() => prdVersions.id, { onDelete: 'set null' }),
  structuredQuestion: text('structured_question').notNull(),
  availableOptions: json('available_options'),
  founderAnswer: text('founder_answer'),
  optionalComment: text('optional_comment'),
  aiInterpretation: text('ai_interpretation'),
  prdImpact: text('prd_impact'),
  questionType: text('question_type').notNull().default('clarification'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('question_history_project_id_idx').on(t.projectId),
  index('question_history_prd_version_id_idx').on(t.prdVersionId),
]);

export type QuestionHistory = typeof questionHistory.$inferSelect;
export type NewQuestionHistory = typeof questionHistory.$inferInsert;
