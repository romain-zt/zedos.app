-- Migration 0017: plan tier + subscriptions + red-team review + team data room bundles.
-- Covers four scope slices:
--   payments--builder-subscription-checkout
--   delivery--export-cursor-conversion-gate
--   team-data-room--bundle-export-zip
--   ai-red-team--adversarial-review-report

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_tier" text NOT NULL DEFAULT 'free';
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "has_attempted_export" boolean NOT NULL DEFAULT false;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"plan_tier" text NOT NULL,
	"status" text NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"current_period_end" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" USING btree ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_room_bundles" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"generated_by_user_id" text NOT NULL,
	"file_count" integer NOT NULL,
	"byte_size" integer NOT NULL,
	"manifest_json" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_room_bundles" ADD CONSTRAINT "data_room_bundles_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_room_bundles" ADD CONSTRAINT "data_room_bundles_generated_by_user_id_users_id_fk" FOREIGN KEY ("generated_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "data_room_bundles_project_id_idx" ON "data_room_bundles" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "data_room_bundles_user_id_idx" ON "data_room_bundles" USING btree ("generated_by_user_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "red_team_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"prd_version_id" text NOT NULL,
	"requested_by_user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"credit_cost" integer NOT NULL,
	"finding_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "red_team_reports" ADD CONSTRAINT "red_team_reports_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "red_team_reports" ADD CONSTRAINT "red_team_reports_prd_version_id_prd_versions_id_fk" FOREIGN KEY ("prd_version_id") REFERENCES "public"."prd_versions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "red_team_reports" ADD CONSTRAINT "red_team_reports_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "red_team_reports_project_id_idx" ON "red_team_reports" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "red_team_reports_prd_version_id_idx" ON "red_team_reports" USING btree ("prd_version_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "red_team_reports_status_idx" ON "red_team_reports" USING btree ("status");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "red_team_findings" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"section_id" text,
	"title" text NOT NULL,
	"evidence" text NOT NULL,
	"suggestion" text NOT NULL,
	"metadata" json DEFAULT '{}'::json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "red_team_findings" ADD CONSTRAINT "red_team_findings_report_id_red_team_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."red_team_reports"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "red_team_findings_report_id_idx" ON "red_team_findings" USING btree ("report_id","sort_order");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "red_team_findings_section_id_idx" ON "red_team_findings" USING btree ("section_id");
