import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function queryUsers() {
  try {
    const users = await sql`
      SELECT id, email, name, role, subscription_plan, subscription_status,
             email_verified, created_at, stripe_customer_id, stripe_subscription_id
      FROM "user"
      ORDER BY created_at DESC
    `;

    console.log('\n=== USERS IN DATABASE ===\n');

    if (users.length === 0) {
      console.log('No users found');
    } else {
      console.log(`Total users: ${users.length}\n`);
      users.forEach((user, index) => {
        console.log(`--- User ${index + 1} ---`);
        console.log('ID:', user.id);
        console.log('Email:', user.email);
        console.log('Name:', user.name);
        console.log('Role:', user.role);
        console.log('Plan:', user.subscription_plan || 'none');
        console.log('Status:', user.subscription_status || 'none');
        console.log('Email Verified:', user.email_verified);
        console.log('Stripe Customer:', user.stripe_customer_id || 'none');
        console.log('Stripe Subscription:', user.stripe_subscription_id || 'none');
        console.log('Created:', user.created_at);
        console.log('');
      });
    }

    await sql.end();
  } catch (error) {
    console.error('Error querying users:', error);
    await sql.end();
    process.exit(1);
  }
}

queryUsers();
