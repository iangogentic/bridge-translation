/**
 * Better Auth configuration for Bridge
 * Uses email magic links for authentication
 * Integrates with Resend MCP for email sending
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';

// Custom email sender using Resend MCP
async function sendMagicLinkEmail(email: string, url: string) {
  try {
    // In production, this will call the Resend MCP via code-executor
    // For now, we'll log the magic link (development mode)
    if (process.env.NODE_ENV === 'development') {
      console.log('=== MAGIC LINK ===');
      console.log(`To: ${email}`);
      console.log(`URL: ${url}`);
      console.log('==================');
      return;
    }

    // Production: Use Resend MCP via code-executor
    // This would be called from a server action or API route
    const response = await fetch(process.env.NEXT_PUBLIC_APP_URL + '/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: 'Sign in to Bridge',
        text: `Click to sign in: ${url}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Sign in to Bridge</h1>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.5; margin-bottom: 24px;">
                Click the button below to securely sign in to your Bridge account. This link will expire in 10 minutes.
              </p>
              <a href="${url}" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Sign In to Bridge
              </a>
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                If you didn't request this email, you can safely ignore it.
              </p>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send magic link email');
    }
  } catch (error) {
    console.error('Error sending magic link:', error);
    throw error;
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMagicLinkEmail(user.email, url);
    },
  },
  secret: process.env.BETTER_AUTH_SECRET || 'dev-secret-change-in-production',
  advanced: {
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookieSameSite: 'lax',
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
});

export type Session = typeof auth.$Infer.Session;
