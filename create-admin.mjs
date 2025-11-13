import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';
import { hashPassword } from 'better-auth/crypto';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || 'Admin';

  if (!email || !password) {
    console.error('Usage: node create-admin.mjs <email> <password> [name]');
    console.error('Example: node create-admin.mjs admin@bridge.com MySecurePass123 "Admin User"');
    process.exit(1);
  }

  try {
    console.log(`\n🔐 Creating admin account...`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: admin\n`);

    // Check if user already exists
    const existing = await sql`
      SELECT id, email FROM "user" WHERE email = ${email}
    `;

    if (existing.length > 0) {
      console.error(`❌ User with email ${email} already exists (ID: ${existing[0].id})`);
      console.log('\n💡 To update existing user to admin, use a different email or delete the existing user first');
      await sql.end();
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create admin user
    const [user] = await sql`
      INSERT INTO "user" (
        id,
        email,
        name,
        email_verified,
        role,
        subscription_plan,
        subscription_status,
        translation_count,
        translation_limit,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        ${email},
        ${name},
        true,
        'admin',
        'enterprise',
        'active',
        0,
        10000,
        NOW(),
        NOW()
      )
      RETURNING id, email, name, role
    `;

    console.log(`✅ Admin user created successfully!`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}\n`);

    // Create account record (for Better Auth)
    await sql`
      INSERT INTO "account" (
        id,
        account_id,
        provider_id,
        user_id,
        access_token,
        refresh_token,
        id_token,
        access_token_expires_at,
        refresh_token_expires_at,
        scope,
        password,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        ${user.id},
        'credential',
        ${user.id},
        null,
        null,
        null,
        null,
        null,
        null,
        ${hashedPassword},
        NOW(),
        NOW()
      )
    `;

    console.log(`✅ Password set successfully!\n`);
    console.log(`🎉 Admin account is ready to use!\n`);
    console.log(`Login at: https://bridge-umber-pi.vercel.app/auth/signin`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: [the password you provided]\n`);

    await sql.end();
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    await sql.end();
    process.exit(1);
  }
}

createAdmin();
