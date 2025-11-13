/**
 * Welcome Page
 *
 * Users land here after completing account setup.
 * Provides onboarding and quick start guide.
 */

'use client';

import dynamic from 'next/dynamic';

// Import the actual welcome page component with no SSR
const WelcomeClient = dynamic(() => import('./WelcomeClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>
  ),
});

export default function WelcomePage() {
  return <WelcomeClient />;
}
