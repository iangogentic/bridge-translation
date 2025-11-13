import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function checkSignupStatus() {
  console.log('\n=== RECENT SIGNUPS AND EMAIL STATUS ===\n');

  try {
    // Get most recent users created
    console.log('📋 RECENT USERS (last 5):');
    const recentUsers = await sql`
      SELECT id, email, name, email_verified, role, created_at,
             stripe_customer_id, subscription_status
      FROM "user"
      ORDER BY created_at DESC
      LIMIT 5
    `;
    console.table(recentUsers);

    // Get recent verification tokens (magic links)
    console.log('\n🔑 RECENT VERIFICATION TOKENS:');
    const recentTokens = await sql`
      SELECT id, identifier, value, expires_at, created_at
      FROM verification
      ORDER BY created_at DESC
      LIMIT 10
    `;
    console.table(recentTokens);

    // Get accounts without passwords (pending setup)
    console.log('\n⏳ PENDING ACCOUNT SETUPS (no password yet):');
    const pendingSetups = await sql`
      SELECT u.id, u.email, u.name, u.created_at,
             CASE WHEN a.password IS NULL THEN 'NO PASSWORD' ELSE 'HAS PASSWORD' END as setup_status
      FROM "user" u
      LEFT JOIN account a ON u.id = a.user_id AND a.provider_id = 'credential'
      WHERE u.created_at > NOW() - INTERVAL '7 days'
      ORDER BY u.created_at DESC
    `;
    console.table(pendingSetups);

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkSignupStatus();
