/**
 * Upgrade Checkout Session API
 *
 * Called by authenticated users who want to upgrade from free to paid plan
 * Creates a Stripe checkout session with userId in metadata to link to existing account
 *
 * Flow:
 * 1. User clicks "Upgrade" in the app
 * 2. This endpoint creates Stripe checkout session with userId in metadata
 * 3. Returns checkout URL
 * 4. User completes payment on Stripe
 * 5. Stripe webhook updates existing user's subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to upgrade.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // Get plan from request body (optional - default to pro)
    const body = await req.json().catch(() => ({}));
    const { priceId } = body;

    // Default to Pro plan if no price ID provided
    const finalPriceId = priceId || process.env.STRIPE_PRICE_PRO;

    if (!finalPriceId) {
      return NextResponse.json(
        { error: 'Price ID not configured. Please contact support.' },
        { status: 500 }
      );
    }

    console.log(`Creating upgrade checkout for user ${userId} (${userEmail})`);

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${APP_URL}/settings/billing?upgrade=cancelled`,
      metadata: {
        userId: userId, // IMPORTANT: Links checkout to existing user
        source: 'app_upgrade',
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
      allow_promotion_codes: true,
    });

    console.log(`✅ Upgrade checkout created: ${checkoutSession.id}`);

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error: any) {
    console.error('Upgrade checkout creation failed:', error);
    console.error('Error details:', {
      type: error.type,
      message: error.message,
      stack: error.stack,
    });

    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid payment configuration. Please contact support.', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create upgrade checkout session', details: error.message },
      { status: 500 }
    );
  }
}
