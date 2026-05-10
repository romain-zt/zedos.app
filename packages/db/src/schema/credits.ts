import { pgTable, text, integer, json, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { users } from './users';

export const creditTransactions = pgTable('credit_transactions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  operationType: text('operation_type'),
  metadata: json('metadata'),
  correlationId: text('correlation_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('credit_transactions_user_id_idx').on(t.userId),
  index('credit_transactions_created_at_idx').on(t.createdAt),
  unique('credit_transactions_user_correlation_idx').on(t.userId, t.correlationId),
]);

export const processedWebhookEvents = pgTable('processed_webhook_events', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  eventId: text('event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
}, (t) => [index('processed_webhook_events_processed_at_idx').on(t.processedAt)]);

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type ProcessedWebhookEvent = typeof processedWebhookEvents.$inferSelect;
export type NewProcessedWebhookEvent = typeof processedWebhookEvents.$inferInsert;

export type CreditTransactionInsertFull = {
  id?: string;
  userId: string;
  type: string;
  amount: number;
  balanceAfter: number;
  operationType?: string | null;
  metadata?: unknown;
  correlationId?: string | null;
  createdAt?: Date;
};
