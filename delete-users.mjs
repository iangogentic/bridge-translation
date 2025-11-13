import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function deleteAllUsers() {
  try {
    // First, get all users to show what we're deleting
    const users = await sql`
      SELECT id, email FROM "user" ORDER BY created_at DESC
    `;

    console.log('\n=== USERS TO DELETE ===\n');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    if (users.length === 0) {
      console.log('No users to delete');
      await sql.end();
      return;
    }

    console.log(`\nDeleting ${users.length} users...\n`);

    // Delete all related records first (sessions, accounts, verification tokens)
    await sql`DELETE FROM "session"`;
    console.log('✅ Deleted all sessions');

    await sql`DELETE FROM "account"`;
    console.log('✅ Deleted all accounts');

    await sql`DELETE FROM "verification"`;
    console.log('✅ Deleted all verification tokens');

    // Now delete users
    const result = await sql`DELETE FROM "user"`;
    console.log(`✅ Deleted all users (${result.count} records)`);

    console.log('\n✅ All users and related data have been deleted from the database\n');

    await sql.end();
  } catch (error) {
    console.error('❌ Error deleting users:', error);
    await sql.end();
    process.exit(1);
  }
}

deleteAllUsers();
