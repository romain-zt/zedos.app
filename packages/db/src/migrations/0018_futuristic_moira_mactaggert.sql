-- Trimmed from drizzle-kit generate output: the generator diffed against the
-- 0010 snapshot (migrations 0011-0017 were authored without snapshots), so the
-- raw output re-created existing tables and tried to drop live constraints.
-- Only the genuinely new objects are kept: agent_activities, team_plans,
-- milestones, tickets (+ provenance FKs following the task-split precedent).
CREATE TABLE IF NOT EXISTS "agent_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"agent_role" text NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"summary" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"plan" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "team_plans_project_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"starts_on" date,
	"due_on" date,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'backlog' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"estimate" integer,
	"assignee_role" text,
	"user_story_line_id" text,
	"task_split_task_id" text,
	"milestone_id" text,
	"due_date" date,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "tickets_project_number_unique" UNIQUE("project_id","number"),
	CONSTRAINT "tickets_task_split_task_unique" UNIQUE("task_split_task_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent_activities" ADD CONSTRAINT "agent_activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_plans" ADD CONSTRAINT "team_plans_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_milestone_id_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."milestones"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_story_line_id_user_story_lines_id_fk" FOREIGN KEY ("user_story_line_id") REFERENCES "public"."user_story_lines"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tickets" ADD CONSTRAINT "tickets_task_split_task_id_task_split_tasks_id_fk" FOREIGN KEY ("task_split_task_id") REFERENCES "public"."task_split_tasks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_activities_project_created_idx" ON "agent_activities" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agent_activities_project_status_idx" ON "agent_activities" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "team_plans_project_id_idx" ON "team_plans" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "milestones_project_id_idx" ON "milestones" USING btree ("project_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_project_status_idx" ON "tickets" USING btree ("project_id","status","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_project_milestone_idx" ON "tickets" USING btree ("project_id","milestone_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_project_due_idx" ON "tickets" USING btree ("project_id","due_date");
