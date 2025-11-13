import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const sql = postgres(process.env.DATABASE_URL);

async function checkDatabase() {
  console.log('\n=== DATABASE STRUCTURE ANALYSIS ===\n');

  try {
    // Check user table structure
    console.log('📋 USER TABLE:');
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user'
      ORDER BY ordinal_position
    `;
    console.table(userColumns);

    // Check account table structure
    console.log('\n📋 ACCOUNT TABLE:');
    const accountColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'account'
      ORDER BY ordinal_position
    `;
    console.table(accountColumns);

    // Check session table structure
    console.log('\n📋 SESSION TABLE:');
    const sessionColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'session'
      ORDER BY ordinal_position
    `;
    console.table(sessionColumns);

    // Check verification table structure
    console.log('\n📋 VERIFICATION TABLE:');
    const verificationColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'verification'
      ORDER BY ordinal_position
    `;
    console.table(verificationColumns);

    // Check if there's a duplicate users table
    console.log('\n📋 CHECKING FOR DUPLICATE TABLES:');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    console.log('All tables:', tables.map(t => t.table_name).join(', '));

    // Check actual data in user table
    console.log('\n📋 USER RECORDS (for ian@gogentic.ai):');
    const users = await sql`
      SELECT *
      FROM "user"
      WHERE email LIKE '%ian%'
    `;
    console.log(JSON.stringify(users, null, 2));

    // Check actual data in account table for that user
    if (users.length > 0) {
      console.log('\n📋 ACCOUNT RECORDS (for that user):');
      const accounts = await sql`
        SELECT *
        FROM account
        WHERE user_id = ${users[0].id}
      `;
      console.log(JSON.stringify(accounts, null, 2));
    }

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkDatabase();
