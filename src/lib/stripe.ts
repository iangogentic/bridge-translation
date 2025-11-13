/**
 * Stripe Configuration
 *
 * Initializes Stripe with secret key from environment variables.
 * Used for creating checkout sessions, managing subscriptions, and processing webhooks.
 */

import Stripe from 'stripe';

function getStripe(): Stripe {
  const rawKey = process.env.STRIPE_SECRET_KEY;
  const key = rawKey?.trim(); // Remove any whitespace/newlines

  console.log('Stripe initialization:', {
    keyExists: !!key,
    keyPrefix: key?.substring(0, 7),
    keyLength: key?.length,
    rawKeyLength: rawKey?.length,
  });

  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }

  return new Stripe(key, {
    typescript: true,
    maxNetworkRetries: 2,
  });
}

// Export getter function - creates new instance each time to ensure env vars are read
export const stripe = getStripe();

/**
 * Stripe Price IDs
 * Updated: Nov 13, 2025
 *
 * Starter: $10/month - price_1SSphPGR3TRIHwfHDFqZV7fD
 * Pro: $29/month - price_1SSphQGR3TRIHwfHytkuxp89
 * Enterprise: Custom - price_1SSQydGR3TRIHwfHUmT7NXJf
 */
export const STRIPE_PLANS = {
  starter: 'price_1SSphPGR3TRIHwfHDFqZV7fD', // $10/month
  pro: 'price_1SSphQGR3TRIHwfHytkuxp89', // $29/month
  enterprise: 'price_1SSQydGR3TRIHwfHUmT7NXJf', // Custom pricing
} as const;

export type StripePlanId = keyof typeof STRIPE_PLANS;
