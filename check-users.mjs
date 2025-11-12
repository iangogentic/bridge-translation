import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function checkUsers() {
  try {
    console.log('Checking users in database:\n');

    const users = await sql`
      SELECT id, email, name, role, "emailVerified", "createdAt",
             "subscriptionStatus", "subscriptionPlan"
      FROM "user"
      ORDER BY "createdAt" DESC
      LIMIT 10
    `;

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\nThis means the Stripe webhook has not created any users yet.');
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      users.forEach((user, i) => {
        console.log(`${i + 1}. ${user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Email Verified: ${user.emailVerified}`);
        console.log(`   Subscription: ${user.subscriptionPlan} (${user.subscriptionStatus})`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkUsers();
