import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  email: text('email').notNull().unique(),
  /** Required by better-auth default user model (`requireEmailVerification: false` still persists this flag). */
  emailVerified: boolean('email_verified').notNull().default(false),
  /** Optional profile image URL (better-auth default user field). */
  image: text('image'),
  /**
   * Legacy app hash for hex sign-up flow; null when the user only exists via better-auth
   * (password lives on `accounts.password`).
   */
  passwordHash: text('password_hash'),
  name: text('name').notNull(),
  creditBalance: integer('credit_balance').notNull().default(0),
  starterCreditsGranted: boolean('starter_credits_granted').notNull().default(false),
  graceUsed: boolean('grace_used').notNull().default(false),
  /**
   * Plan tier mirror — derived from active subscription, advisory source-of-truth is `subscriptions`.
   * 'free' | 'builder' | 'pro' | 'team'. Default 'free'. Updated synchronously on webhook.
   */
  planTier: text('plan_tier').notNull().default('free'),
  /** First Cursor export attempt per account — used by conversion gate to lower repeat-visit friction. */
  hasAttemptedExport: boolean('has_attempted_export').notNull().default(false),
  marketingConsent: boolean('marketing_consent').notNull().default(false),
  productUpdatesConsent: boolean('product_updates_consent').notNull().default(false),
  consentUpdatedAt: timestamp('consent_updated_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
