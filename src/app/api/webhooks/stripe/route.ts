/**
 * Stripe Webhook Handler
 *
 * Receives events from Stripe after payments and subscription changes.
 * Creates user accounts, sends welcome emails, and manages subscription status.
 *
 * Events handled:
 * - checkout.session.completed: New subscription → Create user + send welcome email
 * - customer.subscription.updated: Plan change or status update
 * - customer.subscription.deleted: Cancellation
 * - invoice.payment_failed: Failed payment → Send reminder email
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { user, verification } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { auth } from '@/lib/auth';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET?.trim() || '';
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();

if (!WEBHOOK_SECRET) {
  console.warn('⚠️  STRIPE_WEBHOOK_SECRET is not set. Webhook signature verification will fail.');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout - create user account and send welcome email
 */
async function handleCheckoutCompleted(session: any) {
  const email = session.customer_email || session.metadata?.email;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!email) {
    console.error('No email found in checkout session');
    return;
  }

  console.log(`✅ Checkout completed for ${email}`);

  // Fetch subscription details from Stripe
  const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  // Determine plan name from price ID
  let planName = 'starter';
  if (priceId?.includes('pro')) planName = 'pro';
  if (priceId?.includes('enterprise')) planName = 'enterprise';

  // Check if user already exists (by email)
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  let userId: string;

  if (existingUser.length > 0) {
    // User exists - update with Stripe info
    userId = existingUser[0].id;
    await db
      .update(user)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        subscriptionStatus: subscription.status,
        subscriptionPlan: planName,
        subscriptionStartDate: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : new Date(),
        subscriptionEndDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(),
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    console.log(`Updated existing user ${userId} with Stripe subscription`);
  } else {
    // Create new user account using Better Auth (without password yet)
    const userName = email.split('@')[0]; // Use email prefix as default name

    // Generate a temporary secure random password that will be replaced during setup
    const tempPassword = crypto.randomBytes(32).toString('hex');

    // Use Better Auth's admin createUser API
    try {
      const result = await auth.api.createUser({
        body: {
          email: email,
          name: userName,
          password: tempPassword, // Temporary password - user will set their own in setup
          data: {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: subscription.status,
            subscriptionPlan: planName,
            subscriptionStartDate: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : new Date().toISOString(),
            subscriptionEndDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : new Date().toISOString(),
            trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          },
        },
      });

      userId = result.user.id;

      // Update user record with Stripe info (Better Auth's createUser doesn't support these fields directly)
      await db
        .update(user)
        .set({
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: subscription.status,
          subscriptionPlan: planName,
          subscriptionStartDate: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : new Date(),
          subscriptionEndDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(),
          trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));

      console.log(`Created new user ${userId} for ${email} via Better Auth`);
    } catch (createError: any) {
      console.error('Better Auth createUser failed:', createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }
  }

  // Generate magic link token for account setup
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(verification).values({
    id: crypto.randomUUID(),
    identifier: `setup-${email}`,
    value: token,
    expiresAt: expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Send welcome email with magic link via Resend MCP
  const setupUrl = `${APP_URL}/auth/setup?token=${token}`;

  try {
    // Use Resend to send email
    const response = await fetch(`${APP_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
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

                <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Your Subscription Details</h3>
                <ul style="font-size: 14px; color: #666; line-height: 2;">
                  <li><strong>Plan:</strong> ${planName.charAt(0).toUpperCase() + planName.slice(1)}</li>
                  <li><strong>Status:</strong> ${subscription.trial_end ? 'Free Trial' : 'Active'}</li>
                  ${subscription.trial_end ? `<li><strong>Trial ends:</strong> ${new Date(subscription.trial_end * 1000).toLocaleDateString()}</li>` : ''}
                  <li><strong>Next billing date:</strong> ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}</li>
                </ul>

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
      }),
    });

    if (response.ok) {
      console.log(`✅ Welcome email sent to ${email}`);
    } else {
      console.error(`❌ Failed to send welcome email to ${email}`);
    }
  } catch (emailError) {
    console.error('Error sending welcome email:', emailError);
    // Don't fail the webhook if email fails - user account is still created
  }
}

/**
 * Handle subscription updates (plan changes, status changes)
 */
async function handleSubscriptionUpdated(subscriptionData: any) {
  const subscription: any = subscriptionData;
  const customerId = subscription.customer;
  const subscriptionId = subscription.id;

  console.log(`🔄 Subscription updated: ${subscriptionId}`);

  // Find user by Stripe customer ID
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.stripeCustomerId, customerId))
    .limit(1);

  if (existingUser.length === 0) {
    console.error(`No user found for Stripe customer ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  let planName = 'starter';
  if (priceId?.includes('pro')) planName = 'pro';
  if (priceId?.includes('enterprise')) planName = 'enterprise';

  // Update subscription details
  await db
    .update(user)
    .set({
      subscriptionStatus: subscription.status,
      subscriptionPlan: planName,
      subscriptionStartDate: subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : new Date(),
      subscriptionEndDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : new Date(),
      trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      updatedAt: new Date(),
    })
    .where(eq(user.stripeCustomerId, customerId));

  console.log(`✅ Updated subscription for user ${existingUser[0].id}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer;

  console.log(`❌ Subscription deleted for customer: ${customerId}`);

  await db
    .update(user)
    .set({
      subscriptionStatus: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(user.stripeCustomerId, customerId));
}

/**
 * Handle failed payments
 */
async function handlePaymentFailed(invoice: any) {
  const customerId = invoice.customer;

  console.log(`⚠️  Payment failed for customer: ${customerId}`);

  // Find user
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.stripeCustomerId, customerId))
    .limit(1);

  if (existingUser.length === 0) {
    console.error(`No user found for Stripe customer ${customerId}`);
    return;
  }

  const userEmail = existingUser[0].email;

  // Send payment failed email
  try {
    await fetch(`${APP_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: userEmail,
        subject: '⚠️ Bridge Payment Failed - Action Required',
        html: `
          <p>Hi ${existingUser[0].name},</p>
          <p>We were unable to process your payment for Bridge.</p>
          <p>Please update your payment method to continue using Bridge:</p>
          <p><a href="${APP_URL}/settings/billing">Update Payment Method</a></p>
          <p>If you have any questions, please contact our support team.</p>
          <p>- The Bridge Team</p>
        `,
      }),
    });

    console.log(`✅ Payment failed email sent to ${userEmail}`);
  } catch (error) {
    console.error('Error sending payment failed email:', error);
  }
}
