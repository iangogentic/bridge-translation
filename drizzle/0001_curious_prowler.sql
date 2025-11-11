ALTER TABLE "user" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_status" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_plan" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_end_date" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "trial_ends_at" timestamp;