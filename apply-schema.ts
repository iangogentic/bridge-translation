/**
 * Script to apply schema changes directly to the database
 * Adds role field to user table
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from './src/db';
import { sql } from 'drizzle-orm';

async function applySchema() {
  try {
    console.log('Applying schema changes...');

    // Add role column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'customer';
    `);

    console.log('✓ Added role column');

    // Ensure email unique constraint exists
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'users_email_unique'
        ) THEN
          ALTER TABLE "user" ADD CONSTRAINT users_email_unique UNIQUE (email);
        END IF;
      END $$;
    `);

    console.log('✓ Added email unique constraint');

    console.log('\n✅ Schema changes applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error applying schema:', error);
    process.exit(1);
  }
}

applySchema();
