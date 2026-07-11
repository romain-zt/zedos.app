import { randomUUID } from 'node:crypto';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const waitlistLeads = pgTable(
  'waitlist_leads',
  {
    id: text('id').primaryKey().$defaultFn(() => randomUUID()),
    email: text('email').notNull(),
    name: text('name').notNull(),
    businessName: text('business_name').notNull(),
    businessType: text('business_type').notNull(),
    website: text('website'),
    consentToContact: boolean('consent_to_contact').notNull().default(true),
    source: text('source').notNull().default('wellness-landing'),
    status: text('status').notNull().default('new'),
    practitionerRange: text('practitioner_range'),
    locationRange: text('location_range'),
    bookingPlatform: text('booking_platform'),
    mainChallenge: text('main_challenge'),
    launchTimeframe: text('launch_timeframe'),
    desiredChange: text('desired_change'),
    qualifiedAt: timestamp('qualified_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('waitlist_leads_email_unique').on(table.email),
    index('waitlist_leads_status_created_idx').on(table.status, table.createdAt),
  ]
);

export type WaitlistLead = typeof waitlistLeads.$inferSelect;
export type NewWaitlistLead = typeof waitlistLeads.$inferInsert;
