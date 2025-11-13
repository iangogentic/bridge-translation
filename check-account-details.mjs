import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function checkAccount() {
  const email = 'ian@gogentic.ai';

  console.log(`\nChecking account details for: ${email}\n`);

  try {
    // Check user
    const users = await sql`
      SELECT id, email, name, email_verified, role, created_at
      FROM "user"
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      console.log('❌ User not found');
    } else {
      console.log('✅ User found:');
      console.log(JSON.stringify(users[0], null, 2));
    }

    // Check accounts
    if (users.length > 0) {
      const accounts = await sql`
        SELECT id, provider_id, account_id,
               CASE WHEN password IS NOT NULL THEN 'YES (hash exists)' ELSE 'NO' END as has_password,
               created_at
        FROM account
        WHERE user_id = ${users[0].id}
      `;

      console.log('\n📋 Accounts:');
      if (accounts.length === 0) {
        console.log('❌ No accounts found');
      } else {
        accounts.forEach(acc => {
          console.log(JSON.stringify(acc, null, 2));
        });
      }
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkAccount();
