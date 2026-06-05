CREATE TABLE IF NOT EXISTS "decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"prd_version_id" text,
	"question_history_id" text NOT NULL,
	"structured_question" text NOT NULL,
	"chosen_option" text,
	"rejected_options" json DEFAULT '[]'::json NOT NULL,
	"owner_comment" text,
	"ai_interpretation" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decision_links" (
	"id" text PRIMARY KEY NOT NULL,
	"decision_id" text NOT NULL,
	"section_id" text NOT NULL,
	"anchor" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decisions" ADD CONSTRAINT "decisions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decisions" ADD CONSTRAINT "decisions_prd_version_id_prd_versions_id_fk" FOREIGN KEY ("prd_version_id") REFERENCES "public"."prd_versions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decisions" ADD CONSTRAINT "decisions_question_history_id_question_history_id_fk" FOREIGN KEY ("question_history_id") REFERENCES "public"."question_history"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decision_links" ADD CONSTRAINT "decision_links_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "decisions_question_history_id_uidx" ON "decisions" USING btree ("question_history_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decisions_project_id_idx" ON "decisions" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decisions_prd_version_id_idx" ON "decisions" USING btree ("prd_version_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decision_links_decision_id_idx" ON "decision_links" USING btree ("decision_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decision_links_section_id_idx" ON "decision_links" USING btree ("section_id");
