import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not found in .env.local');
}

const sql = postgres(process.env.DATABASE_URL);

console.log('🔧 Adding banned column to user table...\n');

try {
  // Add the banned column if it doesn't exist
  await sql`
    ALTER TABLE "user"
    ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false;
  `;

  console.log('✅ Successfully added "banned" column to user table');

  // Verify the column was added
  const columns = await sql`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'user'
    ORDER BY ordinal_position;
  `;

  console.log('\n📋 Updated user table schema:');
  console.table(columns);

  // Check if banned column exists
  const bannedColumn = columns.find(c => c.column_name === 'banned');
  if (bannedColumn) {
    console.log('\n✅ VERIFIED: banned column exists');
    console.log('   Type:', bannedColumn.data_type);
    console.log('   Default:', bannedColumn.column_default);
  } else {
    console.log('\n❌ ERROR: banned column not found after migration');
  }

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  await sql.end();
}
