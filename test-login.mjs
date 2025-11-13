import { chromium } from 'playwright';

const PRODUCTION_URL = 'https://bridge-umber-pi.vercel.app';
const TEST_EMAIL = 'ian@gogentic.ai';
const TEST_PASSWORD = 'ian678678';

async function testLogin() {
  console.log('🧪 Testing login on production...\n');
  console.log('URL:', PRODUCTION_URL);
  console.log('Email:', TEST_EMAIL);
  console.log('Password:', '***hidden***\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto(`${PRODUCTION_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot before login
    await page.screenshot({ path: 'login-before.png', fullPage: true });
    console.log('✅ Screenshot saved: login-before.png');

    // Fill in login form
    console.log('✏️  Filling in login form...');
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    // Take screenshot with filled form
    await page.screenshot({ path: 'login-filled.png', fullPage: true });
    console.log('✅ Screenshot saved: login-filled.png');

    // Click login button
    console.log('🔘 Clicking login button...');
    await page.click('button[type="submit"]');

    // Wait for navigation or error
    console.log('⏳ Waiting for response...\n');

    await Promise.race([
      page.waitForURL('**/dashboard', { timeout: 10000 }).then(() => 'dashboard'),
      page.waitForURL('**/setup', { timeout: 10000 }).then(() => 'setup'),
      page.waitForSelector('.error, [role="alert"], .text-red-500', { timeout: 10000 }).then(() => 'error'),
      page.waitForTimeout(10000).then(() => 'timeout')
    ]).then(async (result) => {
      await page.waitForTimeout(2000); // Let page stabilize

      // Take screenshot after login attempt
      await page.screenshot({ path: 'login-after.png', fullPage: true });
      console.log('✅ Screenshot saved: login-after.png\n');

      const currentUrl = page.url();
      console.log('📍 Current URL:', currentUrl);

      if (result === 'dashboard') {
        console.log('\n✅ SUCCESS: Login successful! Redirected to dashboard.');
      } else if (result === 'setup') {
        console.log('\n✅ SUCCESS: Login successful! Redirected to setup page.');
      } else if (result === 'error') {
        // Try to find error message
        const errorTexts = await page.$$eval('.error, [role="alert"], .text-red-500',
          els => els.map(el => el.textContent.trim()));
        console.log('\n❌ FAILURE: Login failed with error:', errorTexts.join(', '));
      } else {
        console.log('\n⚠️  TIMEOUT: No clear result after 10 seconds');
        console.log('   This might mean the page is still loading or there\'s a network issue');
      }

      // Get page content for debugging
      const bodyText = await page.textContent('body');
      if (bodyText.toLowerCase().includes('invalid')) {
        console.log('\n❌ Found "invalid" in page content - login likely failed');
        console.log('   Page snippet:', bodyText.substring(0, 200));
      }
    });

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);

    // Take error screenshot
    try {
      await page.screenshot({ path: 'login-error.png', fullPage: true });
      console.log('✅ Error screenshot saved: login-error.png');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError.message);
    }
  } finally {
    console.log('\n🔍 Keeping browser open for 10 seconds for manual inspection...');
    await page.waitForTimeout(10000);

    await browser.close();
    console.log('✅ Browser closed');
  }
}

testLogin().catch(console.error);
