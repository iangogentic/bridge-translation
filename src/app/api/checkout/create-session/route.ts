/**
 * Stripe Checkout Session API
 *
 * Called by the marketing site when user clicks "Get Started"
 * Creates a Stripe checkout session and returns the URL
 *
 * Flow:
 * 1. Marketing site sends email + priceId
 * 2. This endpoint creates Stripe checkout session
 * 3. Returns checkout URL to marketing site
 * 4. User is redirected to Stripe to complete payment
 * 5. After payment, Stripe webhook creates the user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_PLANS } from '@/lib/stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const MARKETING_URL = process.env.MARKETING_SITE_URL || 'https://bridge.com';

export async function POST(req: NextRequest) {
  // Handle CORS
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    'https://bridge-website-theta.vercel.app',
    'https://bridgemarketingsite.vercel.app',
    'http://localhost:3001', // For local development
  ];

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }

  let finalPriceId: string | undefined;

  try {
    const body = await req.json();
    const { email, priceId, returnUrl } = body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers }
      );
    }

    // Determine which price to use
    finalPriceId = priceId;
    if (!finalPriceId) {
      // Default to starter plan if no priceId provided
      finalPriceId = STRIPE_PLANS.starter;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/auth/setup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl || `${MARKETING_URL}/?checkout=cancelled`,
      metadata: {
        email: email,
        source: 'marketing_site',
      },
      subscription_data: {
        metadata: {
          email: email,
        },
        trial_period_days: 14, // 14-day free trial
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    }, { headers });
  } catch (error: any) {
    console.error('Checkout session creation failed:', error);
    console.error('Error details:', {
      type: error.type,
      message: error.message,
      stack: error.stack,
      stripeKeyExists: !!process.env.STRIPE_SECRET_KEY,
      priceId: finalPriceId,
    });

    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: 'Invalid payment configuration. Please contact support.', details: error.message },
        { status: 400, headers }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error.message },
      { status: 500, headers }
    );
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  const allowedOrigins = [
    'https://bridge-website-theta.vercel.app',
    'https://bridgemarketingsite.vercel.app',
    'http://localhost:3001',
  ];

  const headers: HeadersInit = {};

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
  }

  return new NextResponse(null, { status: 200, headers });
}
