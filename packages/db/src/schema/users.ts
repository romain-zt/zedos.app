import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  creditBalance: integer('credit_balance').notNull().default(0),
  starterCreditsGranted: boolean('starter_credits_granted').notNull().default(false),
  graceUsed: boolean('grace_used').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserInsertFull = {
  id?: string;
  email: string;
  passwordHash: string;
  name: string;
  creditBalance?: number;
  starterCreditsGranted?: boolean;
  graceUsed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UserUpdateFull = Partial<Omit<UserInsertFull, 'id' | 'createdAt'>>;
