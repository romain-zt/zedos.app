CREATE TABLE IF NOT EXISTS "project_comment_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"prd_version_id" text,
	"section_id" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp,
	"owner_last_read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_comment_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"thread_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_comment_threads" ADD CONSTRAINT "project_comment_threads_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_comment_threads" ADD CONSTRAINT "project_comment_threads_prd_version_id_prd_versions_id_fk" FOREIGN KEY ("prd_version_id") REFERENCES "public"."prd_versions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_comment_threads" ADD CONSTRAINT "project_comment_threads_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_comment_messages" ADD CONSTRAINT "project_comment_messages_thread_id_project_comment_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."project_comment_threads"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_comment_messages" ADD CONSTRAINT "project_comment_messages_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_comment_threads_project_section_idx" ON "project_comment_threads" USING btree ("project_id","section_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_comment_threads_project_status_idx" ON "project_comment_threads" USING btree ("project_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_comment_threads_prd_version_idx" ON "project_comment_threads" USING btree ("prd_version_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "project_comment_messages_thread_id_idx" ON "project_comment_messages" USING btree ("thread_id","created_at");
