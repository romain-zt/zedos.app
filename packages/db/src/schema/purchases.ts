import { pgTable, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { users } from './users';

export const purchases = pgTable('purchases', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  packSize: integer('pack_size').notNull(),
  amountEur: integer('amount_eur').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  stripeSessionId: text('stripe_session_id'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('purchases_user_id_idx').on(t.userId),
  index('purchases_stripe_session_id_idx').on(t.stripeSessionId),
]);

export const autoReloadPreferences = pgTable('auto_reload_preferences', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull().default(false),
  packSize: integer('pack_size').notNull().default(100),
  thresholdCredits: integer('threshold_credits').notNull().default(5),
  stripePaymentMethodId: text('stripe_payment_method_id'),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type AutoReloadPreference = typeof autoReloadPreferences.$inferSelect;
export type NewAutoReloadPreference = typeof autoReloadPreferences.$inferInsert;
