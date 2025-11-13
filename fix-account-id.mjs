import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function fixAccountId() {
  const userId = '05a24807-9c9c-4259-bee5-047e40d4bb8f';

  console.log('\nFixing account_id for credential provider...\n');

  try {
    // Fix account_id to match user_id for credential provider
    await sql`
      UPDATE account
      SET account_id = ${userId}
      WHERE user_id = ${userId} AND provider_id = 'credential'
    `;

    console.log('✅ Fixed account_id to match user_id');

    // Verify
    const accounts = await sql`
      SELECT account_id, provider_id
      FROM account
      WHERE user_id = ${userId}
    `;

    console.log('\nCurrent account:');
    console.log(accounts[0]);

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixAccountId();
