/**
 * Stripe Configuration
 *
 * Initializes Stripe with secret key from environment variables.
 * Used for creating checkout sessions, managing subscriptions, and processing webhooks.
 */

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) {
    return _stripe;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }

  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-10-29.clover',
    typescript: true,
  });

  return _stripe;
}

// Lazy initialization - only creates Stripe client when first accessed
export const stripe = new Proxy({} as Stripe, {
  get: (target, prop) => {
    const client = getStripe();
    return (client as any)[prop];
  }
});

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
