import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';
import { prdVersions } from './prd-versions';

export const shareLinks = pgTable('share_links', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  prdVersionId: text('prd_version_id').notNull().references(() => prdVersions.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  disabledAt: timestamp('disabled_at'),
}, (t) => [index('share_links_token_idx').on(t.token)]);

export type ShareLink = typeof shareLinks.$inferSelect;
export type NewShareLink = typeof shareLinks.$inferInsert;
