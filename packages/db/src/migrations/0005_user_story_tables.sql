CREATE TABLE IF NOT EXISTS "user_story_corpora" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"feature_split_cluster_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_story_corpora_project_cluster_unique" UNIQUE("project_id","feature_split_cluster_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_story_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"corpus_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"draft_marker" text,
	"archived_at" timestamp,
	"review_ready_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_story_lines_corpus_sort_unique" UNIQUE("corpus_id","sort_order")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_story_corpora" ADD CONSTRAINT "user_story_corpora_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_story_corpora" ADD CONSTRAINT "user_story_corpora_feature_split_cluster_id_feature_split_clusters_id_fk" FOREIGN KEY ("feature_split_cluster_id") REFERENCES "public"."feature_split_clusters"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_story_lines" ADD CONSTRAINT "user_story_lines_corpus_id_user_story_corpora_id_fk" FOREIGN KEY ("corpus_id") REFERENCES "public"."user_story_corpora"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_story_corpora_project_id_idx" ON "user_story_corpora" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_story_corpora_cluster_id_idx" ON "user_story_corpora" USING btree ("feature_split_cluster_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_story_lines_corpus_id_idx" ON "user_story_lines" USING btree ("corpus_id");