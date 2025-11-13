import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });
const sql = postgres(process.env.DATABASE_URL);

async function listAllUsers() {
  try {
    const users = await sql`
      SELECT u.id, u.email, u.name, u.subscription_plan, u.created_at,
             CASE WHEN a.user_id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_password
      FROM "user" u
      LEFT JOIN "account" a ON u.id = a.user_id
      ORDER BY u.created_at DESC
      LIMIT 20
    `;

    console.log('\n=== ALL USERS ===\n');
    console.log(`Found ${users.length} users:\n`);

    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Plan: ${user.subscription_plan || 'none'}`);
      console.log(`   Has Password: ${user.has_password}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });

    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

listAllUsers();
