/**
 * Freemium Model Migration
 * Adds translation tracking fields to user table
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function migrate() {
  try {
    console.log('Starting freemium model migration...');

    // Add translation_count column
    console.log('Adding translation_count column...');
    await sql`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "translation_count" integer DEFAULT 0 NOT NULL
    `;

    // Add translation_limit column
    console.log('Adding translation_limit column...');
    await sql`
      ALTER TABLE "user"
      ADD COLUMN IF NOT EXISTS "translation_limit" integer DEFAULT 5 NOT NULL
    `;

    // Update subscription_plan to have default of 'free'
    console.log('Setting default for subscription_plan...');
    await sql`
      ALTER TABLE "user"
      ALTER COLUMN "subscription_plan" SET DEFAULT 'free'
    `;

    // Update existing users to have free plan if null
    console.log('Updating existing users...');
    await sql`
      UPDATE "user"
      SET "subscription_plan" = 'free'
      WHERE "subscription_plan" IS NULL
    `;

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Changes applied:');
    console.log('  - Added translation_count column (default: 0)');
    console.log('  - Added translation_limit column (default: 5)');
    console.log('  - Set subscription_plan default to "free"');
    console.log('  - Updated existing users to free plan');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

migrate();
