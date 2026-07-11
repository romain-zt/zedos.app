CREATE TABLE IF NOT EXISTS "waitlist_leads" (
  "id" text PRIMARY KEY NOT NULL,
  "email" text NOT NULL,
  "name" text NOT NULL,
  "business_name" text NOT NULL,
  "business_type" text NOT NULL,
  "website" text,
  "consent_to_contact" boolean DEFAULT true NOT NULL,
  "source" text DEFAULT 'wellness-landing' NOT NULL,
  "status" text DEFAULT 'new' NOT NULL,
  "practitioner_range" text,
  "location_range" text,
  "booking_platform" text,
  "main_challenge" text,
  "launch_timeframe" text,
  "desired_change" text,
  "qualified_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "waitlist_leads_email_unique"
  ON "waitlist_leads" USING btree ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "waitlist_leads_status_created_idx"
  ON "waitlist_leads" USING btree ("status", "created_at");