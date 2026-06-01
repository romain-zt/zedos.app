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
-- Neon/preview may already have task_split_* from an older 0010 draft: CREATE TABLE IF NOT EXISTS
-- skips, then FK on user_story_line_id fails. Align columns before constraints.
ALTER TABLE "task_split_bundles" ADD COLUMN IF NOT EXISTS "user_story_line_id" text;--> statement-breakpoint
ALTER TABLE "task_split_bundles" ADD COLUMN IF NOT EXISTS "story_title" text;--> statement-breakpoint
ALTER TABLE "task_split_bundles" ADD COLUMN IF NOT EXISTS "story_body" text;--> statement-breakpoint
ALTER TABLE "task_split_bundles" ADD COLUMN IF NOT EXISTS "locked_at" timestamp;--> statement-breakpoint
ALTER TABLE "task_split_bundles" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "task_split_bundles" ADD COLUMN IF NOT EXISTS "updated_at" timestamp;--> statement-breakpoint
UPDATE "task_split_bundles" SET "updated_at" = COALESCE("updated_at", "created_at", now()) WHERE "updated_at" IS NULL;--> statement-breakpoint
ALTER TABLE "task_split_bundles" DROP COLUMN IF EXISTS "story_title_snapshot";--> statement-breakpoint
ALTER TABLE "task_split_bundles" DROP CONSTRAINT IF EXISTS "task_split_bundles_project_story_line_unique";--> statement-breakpoint
ALTER TABLE "task_split_tasks" ADD COLUMN IF NOT EXISTS "manual" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "task_split_tasks" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;--> statement-breakpoint
UPDATE "task_split_tasks" SET "manual" = false WHERE "manual" IS NULL;--> statement-breakpoint
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
DO $$ BEGIN
 ALTER TABLE "task_split_bundles" ADD CONSTRAINT "task_split_bundles_project_story_line_unique" UNIQUE("project_id","user_story_line_id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_split_bundles_project_id_idx" ON "task_split_bundles" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_split_bundles_locked_at_idx" ON "task_split_bundles" USING btree ("project_id","locked_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_split_tasks_bundle_id_idx" ON "task_split_tasks" USING btree ("bundle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "task_split_tasks_bundle_sort_idx" ON "task_split_tasks" USING btree ("bundle_id","sort_order");