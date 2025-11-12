import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });
const sql = postgres(process.env.DATABASE_URL);

const users = await sql`SELECT email, name, role, subscription_status, subscription_plan FROM "user" ORDER BY created_at DESC LIMIT 10`;

console.log('\nUsers in database:');
if (users.length === 0) {
  console.log('❌ NO USERS FOUND - Stripe webhook hasn\'t created any accounts yet!\n');
} else {
  users.forEach((u, i) => console.log(`${i+1}. ${u.email} | Role: ${u.role} | Sub: ${u.subscription_plan} (${u.subscription_status})`));
  console.log('');
}

await sql.end();
