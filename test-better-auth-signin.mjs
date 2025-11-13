import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const email = 'ian@gogentic.ai';
const password = 'TestPassword123!';

console.log(`\nTesting Better Auth sign-in directly...\n`);
console.log(`Base URL: ${baseURL}`);
console.log(`Email: ${email}`);
console.log(`Password: ${password}\n`);

async function testSignIn() {
  try {
    const response = await fetch(`${baseURL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log(`\nResponse body (raw):`);
    console.log(text);

    try {
      const json = JSON.parse(text);
      console.log(`\nResponse body (JSON):`);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      // Not JSON
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSignIn();
