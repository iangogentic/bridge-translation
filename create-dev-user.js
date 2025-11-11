import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function createDevUser() {
  try {
    console.log('Creating development user...');

    // Fixed UUID for development
    const devUserId = '00000000-0000-0000-0000-000000000001';

    // Insert or update dev user
    const result = await sql`
      INSERT INTO users (id, email, email_verified, created_at, updated_at)
      VALUES (
        ${devUserId}::uuid,
        'dev@bridge.local',
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE
      SET email = 'dev@bridge.local',
          updated_at = NOW()
      RETURNING id, email;
    `;

    console.log('✓ Development user created/updated:');
    console.log('  ID:', result[0].id);
    console.log('  Email:', result[0].email);
    console.log('\n✅ You can now use this user ID in development!');
    console.log(`   userId: '${result[0].id}'`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating dev user:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createDevUser();
