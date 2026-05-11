CREATE TABLE IF NOT EXISTS "feature_split_clusters" (
	"id" text PRIMARY KEY NOT NULL,
	"feature_split_id" text NOT NULL,
	"sort_order" integer NOT NULL,
	"label" text NOT NULL,
	"value_line" text NOT NULL,
	"boundary_cue" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_splits" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"source_prd_version_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "feature_splits_project_prd_version_unique" UNIQUE("project_id","source_prd_version_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feature_split_clusters" ADD CONSTRAINT "feature_split_clusters_feature_split_id_feature_splits_id_fk" FOREIGN KEY ("feature_split_id") REFERENCES "public"."feature_splits"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feature_splits" ADD CONSTRAINT "feature_splits_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "feature_splits" ADD CONSTRAINT "feature_splits_source_prd_version_id_prd_versions_id_fk" FOREIGN KEY ("source_prd_version_id") REFERENCES "public"."prd_versions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feature_split_clusters_feature_split_id_idx" ON "feature_split_clusters" USING btree ("feature_split_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feature_split_clusters_split_sort_idx" ON "feature_split_clusters" USING btree ("feature_split_id","sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feature_splits_project_id_idx" ON "feature_splits" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feature_splits_source_prd_version_id_idx" ON "feature_splits" USING btree ("source_prd_version_id");