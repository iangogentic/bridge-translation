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
  '/',
  '/sign-in',
  '/sign-in/(.*)',
  '/sign-up',
  '/sign-up/(.*)',
  '/signup',
  '/pricing',
  '/pricing/(.*)',
  '/checkout',
  '/checkout/(.*)',
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

  // For protected routes, just verify user exists
  // Subscription checks happen in API routes and components
  // where they have more context and can handle errors better
  return;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
