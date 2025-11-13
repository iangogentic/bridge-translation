/**
 * Subscription and plan utility functions
 */

/**
 * Get translation limit for a given subscription plan
 */
export function getTranslationLimit(plan: string | null): number {
  switch (plan) {
    case 'free':
      return 5;
    case 'starter':
      return 100;
    case 'pro':
      return 1000;
    case 'enterprise':
      return 10000;
    default:
      return 5; // Default to free tier
  }
}

/**
 * Get plan features and limits
 */
export function getPlanFeatures(plan: string | null) {
  const limit = getTranslationLimit(plan);

  return {
    plan: plan || 'free',
    translationLimit: limit,
    features: {
      familySharing: plan !== 'free' && plan !== 'starter',
      prioritySupport: plan === 'pro' || plan === 'enterprise',
      customDomains: plan === 'enterprise',
    },
  };
}
