ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "journey_mode" text DEFAULT 'standard' NOT NULL;
