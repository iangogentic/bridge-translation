# Clerk Migration - Database Schema Updates

## What Changed

### Schema Updates (src/db/schema.ts)
Added new field to the `user` table:
- **clerkUserId**: `TEXT` (nullable, unique)
- **Index**: `clerk_user_id_idx` for fast lookups

### Why These Changes?
1. **clerk_user_id column**: Maps Better Auth users to Clerk users during migration
2. **UNIQUE constraint**: Ensures one-to-one mapping between Clerk and database users
3. **Index**: Enables fast lookups when authenticating with Clerk
4. **Nullable**: Allows existing users to remain in database during gradual migration

## Running the Migration

### Prerequisites
1. Ensure `.env.local` has `DATABASE_URL` set (Neon PostgreSQL)
2. Ensure database is running and accessible

### Run Migration
```bash
node add-clerk-user-id.mjs
```

### Expected Output
```
🔧 Adding clerk_user_id column to user table...

✅ Successfully added "clerk_user_id" column to user table
✅ Successfully added unique constraint to clerk_user_id column
✅ Successfully created index on clerk_user_id column

📋 Updated user table schema:
┌─────────┬────────────────────────────┬───────────────┬─────────────┐
│ (index) │       column_name          │   data_type   │ is_nullable │
├─────────┼────────────────────────────┼───────────────┼─────────────┤
│    0    │ 'id'                       │ 'text'        │ 'NO'        │
│    1    │ 'name'                     │ 'text'        │ 'NO'        │
│    2    │ 'email'                    │ 'text'        │ 'NO'        │
│    3    │ 'email_verified'           │ 'boolean'     │ 'NO'        │
│    4    │ 'image'                    │ 'text'        │ 'YES'       │
│    5    │ 'clerk_user_id'            │ 'text'        │ 'YES'       │
│   ...   │ ...                        │ ...           │ ...         │
└─────────┴────────────────────────────┴───────────────┴─────────────┘

✅ VERIFIED: clerk_user_id column exists
   Type: text
   Nullable: YES

✅ VERIFIED: clerk_user_id_idx index exists
   Definition: CREATE UNIQUE INDEX clerk_user_id_idx ON public."user" USING btree (clerk_user_id)

🎉 Migration complete! You can now sync Clerk users to your database.
```

## Verification

### Check Column Exists
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user' AND column_name = 'clerk_user_id';
```

### Check Index Exists
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user' AND indexname = 'clerk_user_id_idx';
```

### Check Constraint Exists
```sql
SELECT conname, contype
FROM pg_constraint
WHERE conname = 'user_clerk_user_id_unique';
```

## Next Steps

After running this migration:

1. **Set up Clerk Webhook** to sync user data on signup
2. **Update auth middleware** to use `clerk_user_id` for lookups
3. **Create migration script** to populate `clerk_user_id` for existing users
4. **Test dual authentication** (Better Auth + Clerk working side-by-side)
5. **Gradually migrate users** from Better Auth to Clerk
6. **Remove Better Auth** tables once migration is complete

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove index
DROP INDEX IF EXISTS clerk_user_id_idx;

-- Remove column (will also remove constraint)
ALTER TABLE "user" DROP COLUMN IF EXISTS clerk_user_id;
```

## Important Notes

- ✅ **Safe to run multiple times** - Uses `IF NOT EXISTS` checks
- ✅ **No data loss** - Only adds new column, doesn't modify existing data
- ✅ **Non-blocking** - Column is nullable, existing queries work unchanged
- ✅ **Better Auth tables preserved** - session, account, verification tables remain
- ⚠️ **Migration is additive** - Does NOT remove Better Auth functionality

## Database Schema After Migration

```typescript
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),

  // Clerk Integration (NEW!)
  clerkUserId: text("clerk_user_id").unique(),

  // Role-based access control
  role: text("role").default("customer").notNull(),
  banned: boolean("banned").default(false),

  // Stripe Integration Fields
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),
  subscriptionPlan: text("subscription_plan").default("free"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  trialEndsAt: timestamp("trial_ends_at"),

  // Translation Usage Tracking
  translationCount: integer("translation_count").default(0).notNull(),
  translationLimit: integer("translation_limit").default(5).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => ({
  clerkUserIdIdx: uniqueIndex('clerk_user_id_idx').on(table.clerkUserId),
}));
```

---

**Last Updated**: November 2025
**Migration Version**: 1.0
**Status**: Ready to Run
