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
  marketingConsent: boolean('marketing_consent').notNull().default(false),
  productUpdatesConsent: boolean('product_updates_consent').notNull().default(false),
  consentUpdatedAt: timestamp('consent_updated_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
