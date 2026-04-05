CREATE TYPE "public"."user_roles_enum" AS ENUM('viewer', 'analyst', 'admin');--> statement-breakpoint
CREATE TYPE "public"."record_status_enum" AS ENUM('pending', 'posted', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."record_type_enum" AS ENUM('income', 'expense', 'special');--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"user_id" varchar(6) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(6) PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"hashed_password" text NOT NULL,
	"role" "user_roles_enum" DEFAULT 'viewer' NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "record_type_enum" NOT NULL,
	"is_system" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financial_records" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"category_id" varchar(8) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"notes" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"status" "record_status_enum" DEFAULT 'posted' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"deleted_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_records" ADD CONSTRAINT "financial_records_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "cat_type_idx" ON "categories" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "Cat_cat_type_uniq_idx" ON "categories" USING btree ("name","type");--> statement-breakpoint
CREATE INDEX "fr_category_idx" ON "financial_records" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "fr_date_idx" ON "financial_records" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "fr_status_idx" ON "financial_records" USING btree ("status");