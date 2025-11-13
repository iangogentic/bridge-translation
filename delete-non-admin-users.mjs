import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });
const sql = postgres(process.env.DATABASE_URL);

async function deleteNonAdminUsers() {
  try {
    // Find all non-admin users
    const usersToDelete = await sql`
      SELECT id, email, name, role, subscription_plan
      FROM "user"
      WHERE role != 'admin' OR role IS NULL
      ORDER BY created_at DESC
    `;

    console.log('\n=== NON-ADMIN USERS TO DELETE ===\n');
    console.log(`Found ${usersToDelete.length} non-admin users:\n`);

    if (usersToDelete.length === 0) {
      console.log('No non-admin users found.');
      await sql.end();
      return;
    }

    usersToDelete.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} (ID: ${user.id})`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role || 'none'}`);
      console.log(`   Plan: ${user.subscription_plan || 'none'}`);
      console.log('');
    });

    console.log('🗑️  Deleting these users...\n');

    // Delete related data first (foreign key constraints)
    for (const user of usersToDelete) {
      // Delete sessions
      await sql`DELETE FROM "session" WHERE user_id = ${user.id}`;

      // Delete accounts (passwords)
      await sql`DELETE FROM "account" WHERE user_id = ${user.id}`;

      // Delete verification tokens
      await sql`DELETE FROM "verification" WHERE identifier = ${user.email}`;

      // Finally delete the user
      await sql`DELETE FROM "user" WHERE id = ${user.id}`;

      console.log(`✅ Deleted ${user.email}`);
    }

    console.log(`\n✅ Successfully deleted ${usersToDelete.length} non-admin users\n`);
    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

deleteNonAdminUsers();
