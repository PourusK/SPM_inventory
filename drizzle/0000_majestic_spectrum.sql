CREATE TYPE "public"."item_source" AS ENUM('upload', 'manual');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('pending', 'confirmed', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."match_tier" AS ENUM('1', '2', '3');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('main_fleet', 'offshore', 'recycled');--> statement-breakpoint
CREATE TYPE "public"."upload_status" AS ENUM('processing', 'review', 'done', 'failed');--> statement-breakpoint
CREATE TABLE "machinery_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"critical_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reference_fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "machinery_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "machinery_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "machinery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"maker" varchar(255),
	"model_type" varchar(255),
	"serial_no" varchar(255),
	"specs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"raw_text" text,
	"embedding" vector(1536),
	"needs_review" boolean DEFAULT false NOT NULL,
	"source" "item_source" DEFAULT 'manual' NOT NULL,
	"upload_id" integer,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"recycled_item_id" integer NOT NULL,
	"owned_item_id" integer NOT NULL,
	"tier" "match_tier" NOT NULL,
	"confidence_score" numeric NOT NULL,
	"reason" text NOT NULL,
	"status" "match_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"vessel_id" integer NOT NULL,
	"file_url" text NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"status" "upload_status" DEFAULT 'processing' NOT NULL,
	"extracted_count" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vessels" (
	"id" serial PRIMARY KEY NOT NULL,
	"imo_no" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"ex_names" text[] DEFAULT '{}' NOT NULL,
	"source_type" "source_type" NOT NULL,
	"vessel_type" varchar(120),
	"built_year" integer,
	"ldt" numeric,
	"owner" varchar(255),
	"plot_no" varchar(120),
	"beached_date" date,
	"country" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vessels_imo_no_unique" UNIQUE("imo_no")
);
--> statement-breakpoint
ALTER TABLE "machinery_items" ADD CONSTRAINT "machinery_items_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machinery_items" ADD CONSTRAINT "machinery_items_category_id_machinery_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."machinery_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machinery_items" ADD CONSTRAINT "machinery_items_upload_id_uploads_id_fk" FOREIGN KEY ("upload_id") REFERENCES "public"."uploads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machinery_items" ADD CONSTRAINT "machinery_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "machinery_items" ADD CONSTRAINT "machinery_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_recycled_item_id_machinery_items_id_fk" FOREIGN KEY ("recycled_item_id") REFERENCES "public"."machinery_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_owned_item_id_machinery_items_id_fk" FOREIGN KEY ("owned_item_id") REFERENCES "public"."machinery_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_vessel_id_vessels_id_fk" FOREIGN KEY ("vessel_id") REFERENCES "public"."vessels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;