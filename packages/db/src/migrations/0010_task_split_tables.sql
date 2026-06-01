CREATE TABLE IF NOT EXISTS "task_split_bundles" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_story_line_id" text,
	"story_title" text,
	"story_body" text,
	"locked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "task_split_bundles_project_story_line_unique" UNIQUE("project_id","user_story_line_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_split_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"bundle_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"title" text NOT NULL,
	"prompt_body" text NOT NULL,
	"manual" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_split_bundles" ADD CONSTRAINT "task_split_bundles_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_split_bundles" ADD CONSTRAINT "task_split_bundles_user_story_line_id_user_story_lines_id_fk" FOREIGN KEY ("user_story_line_id") REFERENCES "public"."user_story_lines"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "task_split_tasks" ADD CONSTRAINT "task_split_tasks_bundle_id_task_split_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."task_split_bundles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_split_bundles_project_id_idx" ON "task_split_bundles" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_split_bundles_locked_at_idx" ON "task_split_bundles" USING btree ("project_id","locked_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_split_tasks_bundle_id_idx" ON "task_split_tasks" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_split_tasks_bundle_sort_idx" ON "task_split_tasks" USING btree ("bundle_id","sort_order");