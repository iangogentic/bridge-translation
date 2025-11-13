import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });
const sql = postgres(process.env.DATABASE_URL);

async function fixBrokenAccounts() {
  try {
    // Find ALL users without passwords (broken signups)
    const brokenUsers = await sql`
      SELECT u.id, u.email, u.name, u.subscription_plan
      FROM "user" u
      LEFT JOIN "account" a ON u.id = a.user_id
      WHERE a.user_id IS NULL
    `;

    console.log('\n=== BROKEN SIGNUP ACCOUNTS ===\n');
    console.log(`Found ${brokenUsers.length} accounts without passwords:\n`);

    if (brokenUsers.length === 0) {
      console.log('No broken accounts found.');
      await sql.end();
      return;
    }

    brokenUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} (ID: ${user.id}, Plan: ${user.subscription_plan || 'none'})`);
    });

    console.log('\n🗑️  Deleting these accounts...\n');

    // Delete sessions first
    for (const user of brokenUsers) {
      await sql`DELETE FROM "session" WHERE "userId" = ${user.id}`;
      await sql`DELETE FROM "user" WHERE id = ${user.id}`;
      console.log(`✅ Deleted ${user.email}`);
    }

    console.log(`\n✅ Cleaned up ${brokenUsers.length} broken accounts\n`);
    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixBrokenAccounts();
