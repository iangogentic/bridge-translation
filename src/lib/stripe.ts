/**
 * Stripe Configuration
 *
 * Initializes Stripe with secret key from environment variables.
 * Used for creating checkout sessions, managing subscriptions, and processing webhooks.
 */

import Stripe from 'stripe';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }

  return new Stripe(key, {
    apiVersion: '2025-10-29.clover',
    typescript: true,
    maxNetworkRetries: 2,
  });
}

// Export getter function - creates new instance each time to ensure env vars are read
export const stripe = getStripe();

/**
 * Stripe Price IDs (configure these in your Stripe Dashboard)
 *
 * To set up:
 * 1. Go to https://dashboard.stripe.com/products
 * 2. Create products with recurring prices
 * 3. Copy the price IDs (starting with price_) and add to .env.local
 */
export const STRIPE_PLANS = {
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder',
} as const;

export type StripePlanId = keyof typeof STRIPE_PLANS;
