import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not found in .env.local');
}

const sql = postgres(process.env.DATABASE_URL);

console.log('🔧 Adding clerk_user_id column to user table...\n');

try {
  // Add the clerk_user_id column if it doesn't exist
  await sql`
    ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "clerk_user_id" TEXT;
  `;

  console.log('✅ Successfully added "clerk_user_id" column to user table');

  // Add unique constraint if it doesn't exist
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_clerk_user_id_unique'
      ) THEN
        ALTER TABLE "user"
        ADD CONSTRAINT user_clerk_user_id_unique UNIQUE (clerk_user_id);
      END IF;
    END $$;
  `;

  console.log('✅ Successfully added unique constraint to clerk_user_id column');

  // Create index on clerk_user_id for fast lookups if it doesn't exist
  await sql`
    CREATE INDEX IF NOT EXISTS "clerk_user_id_idx"
    ON "user" ("clerk_user_id");
  `;

  console.log('✅ Successfully created index on clerk_user_id column');

  // Verify the column was added
  const columns = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'user'
    ORDER BY ordinal_position;
  `;

  console.log('\n📋 Updated user table schema:');
  console.table(columns);

  // Check if clerk_user_id column exists
  const clerkColumn = columns.find(c => c.column_name === 'clerk_user_id');
  if (clerkColumn) {
    console.log('\n✅ VERIFIED: clerk_user_id column exists');
    console.log('   Type:', clerkColumn.data_type);
    console.log('   Nullable:', clerkColumn.is_nullable);
  } else {
    console.log('\n❌ ERROR: clerk_user_id column not found after migration');
  }

  // Verify index was created
  const indexes = await sql`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'user' AND indexname = 'clerk_user_id_idx';
  `;

  if (indexes.length > 0) {
    console.log('\n✅ VERIFIED: clerk_user_id_idx index exists');
    console.log('   Definition:', indexes[0].indexdef);
  } else {
    console.log('\n❌ ERROR: clerk_user_id_idx index not found after migration');
  }

  console.log('\n🎉 Migration complete! You can now sync Clerk users to your database.');
  console.log('   Next steps:');
  console.log('   1. Set up Clerk webhook to sync user data');
  console.log('   2. Map clerk_user_id when creating/updating users');
  console.log('   3. Use clerk_user_id for lookups in your app');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('\nFull error:', error);
  process.exit(1);
} finally {
  await sql.end();
}
