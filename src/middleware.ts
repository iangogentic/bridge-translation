/**
 * Middleware for subscription-based access control
 *
 * Checks if users have active subscriptions before allowing access to protected routes.
 * Admins and internal users bypass subscription checks.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow access to public pages and APIs WITHOUT session check (performance)
  const publicPages = ['/login', '/pricing', '/signup', '/'];
  const publicAPIs = ['/api/auth', '/api/checkout', '/api/webhooks', '/api/send-email', '/api/admin'];

  // Allow setup flow and share links (token-protected)
  if (pathname.startsWith('/auth/setup') || pathname.startsWith('/share/')) {
    return NextResponse.next();
  }

  if (
    publicPages.some(page => pathname === page) ||
    publicAPIs.some(api => pathname.startsWith(api))
  ) {
    return NextResponse.next();
  }

  // Only import auth when needed (lazy loading to avoid timeouts on public pages)
  const { auth } = await import('@/lib/auth');

  // Get session only for protected routes with timeout
  let session;
  try {
    // Add timeout to prevent middleware hanging
    const sessionPromise = auth.api.getSession({
      headers: request.headers,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Session check timeout')), 3000)
    );

    session = await Promise.race([sessionPromise, timeoutPromise]) as any;
  } catch (error) {
    console.error('[Middleware] Session check failed:', error);
    // If session check fails or times out, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If no session, redirect to login
  if (!session?.user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const user = session.user as any; // Type assertion for custom fields

  // Check if user is admin or internal - they bypass subscription checks
  if (user.role === 'admin' || user.role === 'internal') {
    console.log(`[Middleware] Admin/Internal user ${user.email} - bypassing subscription check`);
    return NextResponse.next();
  }

  // For regular users, check subscription status
  const hasActiveSubscription =
    user.subscriptionStatus === 'active' ||
    user.subscriptionStatus === 'trialing';

  // Check if trial is still valid
  const trialValid = user.trialEndsAt && new Date(user.trialEndsAt) > new Date();

  if (!hasActiveSubscription && !trialValid) {
    // User doesn't have active subscription - redirect to pricing
    console.log(`[Middleware] User ${user.email} - no active subscription, redirecting to pricing`);

    // Don't redirect if already on pricing or checkout pages
    if (pathname.startsWith('/pricing') || pathname.startsWith('/checkout')) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL('/pricing?reason=subscription_required', request.url));
  }

  // User has active subscription or valid trial
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/* (all Next.js internal files)
     * - static files (images, icons, fonts, etc.)
     * - favicon
     * This ensures middleware only runs on actual page routes
     */
    '/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
