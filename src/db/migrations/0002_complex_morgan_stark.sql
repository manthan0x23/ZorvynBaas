ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "financial_records" ADD COLUMN "deleted_at" timestamp with time zone;