CREATE TYPE "public"."format" AS ENUM('webp', 'jpeg', 'png');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('uploaded', 'processing', 'success', 'error');--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" "status" NOT NULL,
	"original_url" varchar(255) NOT NULL,
	"thumbnail_url" varchar(255),
	"thumbnail_width" integer NOT NULL,
	"thumbnail_height" integer NOT NULL,
	"thumbnail_format" "format" NOT NULL
);
