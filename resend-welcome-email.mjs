import { config } from 'dotenv';
import { resolve } from 'path';
import { Resend } from 'resend';
import postgres from 'postgres';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const resend = new Resend(process.env.RESEND_API_KEY);
const sql = postgres(process.env.DATABASE_URL);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bridge-umber-pi.vercel.app';

async function resendWelcomeEmail() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node resend-welcome-email.mjs <email>');
    process.exit(1);
  }

  const normalizedEmail = email.trim().toLowerCase();

  console.log(`\n🔍 Looking up verification token for: ${normalizedEmail}\n`);

  try {
    // Get the latest verification token for this email
    const tokens = await sql`
      SELECT id, identifier, value, expires_at, created_at
      FROM verification
      WHERE identifier = ${'setup-' + normalizedEmail}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (tokens.length === 0) {
      console.error(`❌ No verification token found for ${normalizedEmail}`);
      await sql.end();
      process.exit(1);
    }

    const token = tokens[0];
    const setupUrl = `${APP_URL}/auth/setup?token=${token.value}`;

    console.log(`✅ Found token (created ${token.created_at})`);
    console.log(`🔗 Setup URL: ${setupUrl}\n`);

    // Get user info
    const users = await sql`
      SELECT id, name, subscription_plan, subscription_status
      FROM "user"
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `;

    if (users.length === 0) {
      console.error(`❌ User not found for ${normalizedEmail}`);
      await sql.end();
      process.exit(1);
    }

    const user = users[0];
    const planName = user.subscription_plan || 'starter';

    console.log(`📧 Sending email to ${normalizedEmail}...`);

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Bridge <onboarding@bridgetogether.app>',
      to: [normalizedEmail],
      subject: '🎉 Welcome to Bridge - Set Up Your Account',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Bridge!</h1>
            </div>

            <div style="background: white; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi there,</p>

              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for subscribing to Bridge! Your payment was successful and your <strong>${planName}</strong> plan is now active.
              </p>

              <p style="font-size: 16px; margin-bottom: 30px;">
                To start translating documents, please complete your account setup by creating a password:
              </p>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${setupUrl}"
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                          color: white;
                          padding: 16px 32px;
                          text-decoration: none;
                          border-radius: 8px;
                          font-weight: 600;
                          font-size: 16px;
                          display: inline-block;">
                  Set Up Your Account
                </a>
              </div>

              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                Or copy and paste this link into your browser:<br>
                <a href="${setupUrl}" style="color: #667eea; word-break: break-all;">${setupUrl}</a>
              </p>

              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                This link will expire in 24 hours for security reasons.
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">

              <p style="font-size: 14px; color: #666;">
                Need help? Reply to this email or visit our support center.<br>
                We're here to help you get started!
              </p>

              <p style="font-size: 14px; color: #999; margin-top: 40px;">
                - The Bridge Team
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      await sql.end();
      process.exit(1);
    }

    console.log(`\n✅ Email sent successfully!`);
    console.log(`   Message ID: ${data?.id}`);
    console.log(`   Recipient: ${normalizedEmail}`);

    await sql.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await sql.end();
    process.exit(1);
  }
}

resendWelcomeEmail();
