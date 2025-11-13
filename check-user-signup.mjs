import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });
const sql = postgres(process.env.DATABASE_URL);

async function checkUserSignup() {
  try {
    const email = process.argv[2];

    if (!email) {
      console.log('Usage: node check-user-signup.mjs <email>');
      await sql.end();
      return;
    }

    const user = await sql`
      SELECT id, email, name, role,
             subscription_plan, subscription_status,
             translation_count, translation_limit,
             trial_ends_at, created_at
      FROM "user"
      WHERE email = ${email}
    `;

    if (user.length === 0) {
      console.log(`\n❌ User not found: ${email}\n`);
      await sql.end();
      return;
    }

    const u = user[0];
    console.log('\n=== USER DETAILS ===\n');
    console.log(`Email: ${u.email}`);
    console.log(`Name: ${u.name || 'N/A'}`);
    console.log(`Role: ${u.role || 'none'}`);
    console.log(`Plan: ${u.subscription_plan || 'none'}`);
    console.log(`Status: ${u.subscription_status || 'none'}`);
    console.log(`Translation Count: ${u.translation_count || 0}`);
    console.log(`Translation Limit: ${u.translation_limit || 0}`);
    console.log(`Trial Ends: ${u.trial_ends_at || 'N/A'}`);
    console.log(`Created: ${u.created_at}`);

    console.log('\n=== MIDDLEWARE CHECKS ===\n');

    // Check if user would pass middleware
    const hasActiveSubscription =
      u.subscription_status === 'active' ||
      u.subscription_status === 'trialing';

    const trialValid = u.trial_ends_at && new Date(u.trial_ends_at) > new Date();

    const isFreeWithUsageRemaining =
      u.subscription_plan === 'free' &&
      (u.translation_count || 0) < (u.translation_limit || 5);

    console.log(`Has Active Subscription: ${hasActiveSubscription}`);
    console.log(`Trial Valid: ${trialValid}`);
    console.log(`Free with Usage Remaining: ${isFreeWithUsageRemaining}`);
    console.log(`\nWould Pass Middleware: ${hasActiveSubscription || trialValid || isFreeWithUsageRemaining ? '✅ YES' : '❌ NO (redirect to pricing)'}`);
    console.log('');

    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    await sql.end();
    process.exit(1);
  }
}

checkUserSignup();
