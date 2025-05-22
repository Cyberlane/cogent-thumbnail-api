ALTER TABLE "jobs" ADD COLUMN "thumbnail_id" uuid;--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "original_url";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "thumbnail_url";