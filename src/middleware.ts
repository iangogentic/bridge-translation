import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/**
 * Clerk Middleware for subscription-based access control
 *
 * Enforces:
 * - Authentication for protected routes (via Clerk)
 * - Subscription status for feature access
 * - Admin/internal user bypass
 * - Freemium model (free users with remaining translations)
 */

const publicRoutes = createRouteMatcher([
  '/login',
  '/pricing',
  '/signup',
  '/',
  '/auth/signup',
  '/auth/setup',
  '/share/:path*',
  '/api/auth(.*)',
  '/api/checkout(.*)',
  '/api/webhooks(.*)',
  '/api/send-email(.*)',
  '/api/admin(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes without authentication
  if (publicRoutes(request)) {
    return;
  }

  // Protect all other routes - requires Clerk authentication
  const { userId } = await auth.protect();

  if (!userId) {
    return; // auth.protect() already handles redirect to login
  }

  try {
    // Get user subscription data from local database
    // (synced from Clerk via webhook)
    const dbUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.clerkUserId, userId))
      .limit(1);

    if (!dbUser.length) {
      // User exists in Clerk but not yet synced to local DB
      // This can happen immediately after signup due to webhook delay
      // Allow access - user will appear in DB within seconds via webhook
      return;
    }

    const user = dbUser[0];

    // Admin and internal users bypass all subscription checks
    if (user.role === 'admin' || user.role === 'internal') {
      return;
    }

    // For regular customers, check subscription status
    const hasActiveSubscription =
      user.subscriptionStatus === 'active' ||
      user.subscriptionStatus === 'trialing';

    // Check if trial period is still valid
    const trialValid = user.trialEndsAt && new Date(user.trialEndsAt) > new Date();

    // Check if free user still has remaining translations (freemium model)
    const isFreeWithUsageRemaining =
      user.subscriptionPlan === 'free' &&
      (user.translationCount || 0) < (user.translationLimit || 5);

    // If user has no valid subscription, trial, or free usage - redirect to pricing
    if (!hasActiveSubscription && !trialValid && !isFreeWithUsageRemaining) {
      // Don't redirect if already on pricing or checkout pages
      const pathname = request.nextUrl.pathname;
      if (pathname.startsWith('/pricing') || pathname.startsWith('/checkout')) {
        return;
      }

      // Redirect to pricing page with subscription required reason
      return NextResponse.redirect(
        new URL('/pricing?reason=subscription_required', request.url)
      );
    }
  } catch (error) {
    // If subscription check fails, log but don't block access
    // Better to let user through than break the app
    console.error('[Middleware] Subscription check failed:', error);
    return;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
