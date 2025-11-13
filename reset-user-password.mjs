import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';
import { hashPassword } from 'better-auth/crypto';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function resetPassword() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: node reset-user-password.mjs <email> <password>');
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  console.log(`\nResetting password for: ${normalizedEmail}\n`);

  try {
    // Check if user exists
    const users = await sql`
      SELECT id, email, name
      FROM "user"
      WHERE email = ${normalizedEmail}
    `;

    if (users.length === 0) {
      console.error('❌ User not found');
      await sql.end();
      process.exit(1);
    }

    const user = users[0];
    console.log(`Found user: ${user.name} (${user.email})`);

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Check if account exists
    const accounts = await sql`
      SELECT id
      FROM account
      WHERE user_id = ${user.id} AND provider_id = 'credential'
    `;

    if (accounts.length === 0) {
      // Create credential account
      console.log('Creating credential account...');
      await sql`
        INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
        VALUES (
          ${crypto.randomUUID()},
          ${user.id},
          'credential',
          ${user.id},
          ${hashedPassword},
          NOW(),
          NOW()
        )
      `;
    } else {
      // Update existing account
      console.log('Updating existing account...');
      await sql`
        UPDATE account
        SET password = ${hashedPassword}, updated_at = NOW()
        WHERE user_id = ${user.id} AND provider_id = 'credential'
      `;
    }

    // Mark email as verified
    await sql`
      UPDATE "user"
      SET email_verified = true, updated_at = NOW()
      WHERE id = ${user.id}
    `;

    console.log('\n✅ Password reset successfully!');
    console.log(`\nYou can now login with:`);
    console.log(`  Email: ${normalizedEmail}`);
    console.log(`  Password: ${newPassword}`);

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

resetPassword();
