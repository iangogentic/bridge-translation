import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function fixVerificationTokens() {
  console.log('Fixing verification token identifiers...\n');

  try {
    // Get all setup verification tokens
    const tokens = await sql`
      SELECT id, identifier
      FROM verification
      WHERE identifier LIKE 'setup-%'
    `;

    console.log(`Found ${tokens.length} setup tokens\n`);

    for (const token of tokens) {
      const oldIdentifier = token.identifier;
      const email = oldIdentifier.replace('setup-', '');
      const normalizedEmail = email.trim().toLowerCase();
      const newIdentifier = `setup-${normalizedEmail}`;

      if (oldIdentifier !== newIdentifier) {
        console.log(`Fixing: ${oldIdentifier} → ${newIdentifier}`);

        await sql`
          UPDATE verification
          SET identifier = ${newIdentifier}
          WHERE id = ${token.id}
        `;
      }
    }

    console.log('\n✅ All verification tokens normalized!');

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

fixVerificationTokens();
