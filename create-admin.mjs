import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function createAdmin() {
  const apiKey = process.env.ADMIN_API_KEY;
  // Use command line arg, APP_URL env var, or default to production
  const appUrl = process.argv[2] || process.env.APP_URL || 'https://bridge-umber-pi.vercel.app';

  if (!apiKey) {
    console.error('❌ ADMIN_API_KEY not found in .env.local');
    process.exit(1);
  }

  console.log(`Creating admin user on: ${appUrl}\n`);

  try {
    const response = await fetch(`${appUrl}/api/admin/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-api-key': apiKey,
      },
      body: JSON.stringify({
        email: 'test@bridge.com',
        name: 'Test Admin',
        password: 'TestAdmin123!',
        role: 'admin',
      }),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`Response body: ${responseText}\n`);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response as JSON');
      console.error('Raw response:', responseText);
      process.exit(1);
    }

    if (response.ok) {
      console.log('✅ Admin user created successfully!');
      console.log('\nLogin credentials:');
      console.log('  Email: test@bridge.com');
      console.log('  Password: TestAdmin123!');
      console.log(`  Login at: ${appUrl}/login\n`);
    } else {
      console.error('❌ Failed to create admin user:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

createAdmin();
