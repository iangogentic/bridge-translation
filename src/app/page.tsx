/**
 * Bridge Home Page
 * Upload interface for document translation
 */

'use client';

import dynamic from 'next/dynamic';

// Import the actual home page component with no SSR
const HomeClient = dynamic(() => import('./HomeClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return <HomeClient />;
}
