import { config } from 'dotenv';
import { resolve } from 'path';
import { Resend } from 'resend';

// Load local environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;

console.log('\n=== TESTING RESEND API DIRECTLY ===\n');
console.log('API Key present:', !!RESEND_API_KEY);
console.log('API Key length:', RESEND_API_KEY?.length || 0);
console.log('API Key prefix:', RESEND_API_KEY?.substring(0, 10) + '...\n');

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in .env.production');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

async function testEmail() {
  try {
    console.log('📧 Attempting to send test email...\n');

    const { data, error } = await resend.emails.send({
      from: 'Bridge <onboarding@resend.dev>',
      to: ['ian@gogentic.ai'],
      subject: '🧪 Test Email from Bridge - Direct Resend API',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Test Email</h1>
            </div>

            <div style="background: white; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi,</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                This is a test email to verify that the Resend API key is working correctly.
              </p>

              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                If you received this email, the Resend API integration is working properly.
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">

              <p style="font-size: 14px; color: #999; margin-top: 40px;">
                - The Bridge Team
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      console.error('\nFull error object:', JSON.stringify(error, null, 2));
      process.exit(1);
    }

    console.log('✅ Email sent successfully!\n');
    console.log('Message ID:', data?.id);
    console.log('\nCheck your inbox at ian@gogentic.ai\n');

  } catch (err) {
    console.error('❌ Exception:', err);
    process.exit(1);
  }
}

testEmail();
