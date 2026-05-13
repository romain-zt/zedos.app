ALTER TABLE "user_story_corpora" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_story_lines" ALTER COLUMN "updated_at" SET DEFAULT now();
