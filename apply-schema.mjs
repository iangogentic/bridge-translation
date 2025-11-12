/**
 * Script to apply schema changes directly to the database
 * Adds role field to user table
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables first
config({ path: resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL || DATABASE_URL.includes('placeholder')) {
  console.error('❌ DATABASE_URL not set properly');
  process.exit(1);
}

async function applySchema() {
  const sql = postgres(DATABASE_URL);

  try {
    console.log('Applying schema changes...');
    console.log('Connected to database');

    // Add role column if it doesn't exist
    await sql`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'customer'
    `;

    console.log('✓ Added role column');

    // Ensure email unique constraint exists (check first)
    const constraints = await sql`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'user' AND constraint_name = 'users_email_unique'
    `;

    if (constraints.length === 0) {
      await sql`
        ALTER TABLE "user" ADD CONSTRAINT users_email_unique UNIQUE (email)
      `;
      console.log('✓ Added email unique constraint');
    } else {
      console.log('✓ Email unique constraint already exists');
    }

    console.log('\n✅ Schema changes applied successfully!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    await sql.end();
    process.exit(1);
  }
}

applySchema();
