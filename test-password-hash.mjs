import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';
import { hashPassword, verifyPassword } from 'better-auth/crypto';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function testPasswordHash() {
  const email = 'ian@gogentic.ai';
  const testPassword = 'TestPassword123!';

  console.log(`\nTesting password hash for: ${email}\n`);

  try {
    // Get user and account
    const users = await sql`
      SELECT id, email, name
      FROM "user"
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      console.error('❌ User not found');
      await sql.end();
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Found user: ${user.name} (${user.email})`);

    // Get account with password
    const accounts = await sql`
      SELECT id, account_id, provider_id, password
      FROM account
      WHERE user_id = ${user.id} AND provider_id = 'credential'
    `;

    if (accounts.length === 0) {
      console.error('❌ No credential account found');
      await sql.end();
      process.exit(1);
    }

    const account = accounts[0];
    console.log(`\n✅ Found credential account:`);
    console.log(`   Account ID: ${account.account_id}`);
    console.log(`   Provider: ${account.provider_id}`);
    console.log(`   Password Hash: ${account.password.substring(0, 20)}...`);

    // Test password verification
    console.log(`\n🔐 Testing password verification...`);
    const isValid = await verifyPassword({
      hash: account.password,
      password: testPassword,
    });

    if (isValid) {
      console.log(`✅ Password MATCHES! Hash is correct.`);
    } else {
      console.log(`❌ Password DOES NOT MATCH! Hash may be incorrect.`);

      // Generate what the hash SHOULD be
      console.log(`\n🔄 Generating correct hash for comparison...`);
      const correctHash = await hashPassword(testPassword);
      console.log(`   Expected hash: ${correctHash.substring(0, 20)}...`);
      console.log(`   Actual hash:   ${account.password.substring(0, 20)}...`);
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

testPasswordHash();
