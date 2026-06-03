ALTER TABLE "prd_versions" ADD COLUMN IF NOT EXISTS "deliverable_kind" text DEFAULT 'standard' NOT NULL;
