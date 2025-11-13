import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function checkVerification() {
  try {
    const tokens = await sql`
      SELECT identifier, value, expires_at, created_at
      FROM verification
      WHERE identifier LIKE 'setup-%'
      ORDER BY created_at DESC
    `;

    console.log('\n=== VERIFICATION TOKENS ===\n');

    if (tokens.length === 0) {
      console.log('No setup tokens found');
    } else {
      tokens.forEach((token, index) => {
        console.log(`--- Token ${index + 1} ---`);
        console.log('Email:', token.identifier.replace('setup-', ''));
        console.log('Token:', token.value);
        console.log('Setup URL:', `https://bridge-umber-pi.vercel.app/auth/setup?token=${token.value}`);
        console.log('Expires:', token.expires_at);
        console.log('Created:', token.created_at);
        console.log('');
      });
    }

    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkVerification();
