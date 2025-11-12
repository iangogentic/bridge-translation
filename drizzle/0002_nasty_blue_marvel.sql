ALTER TABLE "documents" DROP CONSTRAINT "documents_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "families" DROP CONSTRAINT "families_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "family_members" DROP CONSTRAINT "family_members_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "shares" DROP CONSTRAINT "shares_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "owner_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "families" ALTER COLUMN "owner_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "family_members" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "shares" ALTER COLUMN "created_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "families" ADD CONSTRAINT "families_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shares" ADD CONSTRAINT "shares_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;