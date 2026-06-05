CREATE TABLE IF NOT EXISTS "github_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"connected_by_user_id" text NOT NULL,
	"owner_login" text NOT NULL,
	"repo_name" text NOT NULL,
	"installation_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"disconnected_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drift_signals" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"kind" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"summary" text NOT NULL,
	"payload" json DEFAULT '{}'::json NOT NULL,
	"source" text NOT NULL,
	"external_delivery_id" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"dismissed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "linear_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"connected_by_user_id" text NOT NULL,
	"team_id" text NOT NULL,
	"linear_project_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"disconnected_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "linear_issue_links" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_story_line_id" text NOT NULL,
	"linear_issue_id" text NOT NULL,
	"linear_issue_identifier" text NOT NULL,
	"status" text DEFAULT 'unknown' NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_connections" ADD CONSTRAINT "github_connections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_connections" ADD CONSTRAINT "github_connections_connected_by_user_id_users_id_fk" FOREIGN KEY ("connected_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "drift_signals" ADD CONSTRAINT "drift_signals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "linear_connections" ADD CONSTRAINT "linear_connections_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "linear_connections" ADD CONSTRAINT "linear_connections_connected_by_user_id_users_id_fk" FOREIGN KEY ("connected_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "linear_issue_links" ADD CONSTRAINT "linear_issue_links_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "linear_issue_links" ADD CONSTRAINT "linear_issue_links_user_story_line_id_user_story_lines_id_fk" FOREIGN KEY ("user_story_line_id") REFERENCES "public"."user_story_lines"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "github_connections_project_id_uidx" ON "github_connections" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "github_connections_repo_idx" ON "github_connections" USING btree ("owner_login","repo_name");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "drift_signals_project_delivery_uidx" ON "drift_signals" USING btree ("project_id","external_delivery_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drift_signals_project_status_idx" ON "drift_signals" USING btree ("project_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "drift_signals_project_created_idx" ON "drift_signals" USING btree ("project_id","created_at");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "linear_connections_project_id_uidx" ON "linear_connections" USING btree ("project_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "linear_issue_links_user_story_line_uidx" ON "linear_issue_links" USING btree ("user_story_line_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "linear_issue_links_project_id_idx" ON "linear_issue_links" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "linear_issue_links_issue_id_idx" ON "linear_issue_links" USING btree ("linear_issue_id");
