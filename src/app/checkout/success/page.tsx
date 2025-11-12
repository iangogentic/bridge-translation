/**
 * Checkout Success Page
 *
 * Users land here after completing Stripe checkout.
 * Informs them to check their email for the setup link.
 */

'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
          Welcome to Bridge!
        </h1>

        <p className="text-lg text-gray-600 text-center mb-8">
          Your subscription is confirmed and your 14-day free trial has started.
        </p>

        {/* Next Steps Card */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <svg
              className="w-6 h-6 text-purple-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Check Your Email
          </h2>
          <p className="text-gray-700 mb-4">
            We've sent a welcome email with a magic link to complete your account setup.
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Click the link in the email to set your password</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Complete your profile</span>
            </li>
            <li className="flex items-start">
              <svg
                className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Start translating documents!</span>
            </li>
          </ul>
        </div>

        {/* Trial Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 text-center">
            <span className="font-semibold text-gray-900">14-day free trial</span> • No charge
            until your trial ends • Cancel anytime
          </p>
        </div>

        {/* Didn't receive email? */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">Didn't receive the email?</p>
          <p className="text-xs text-gray-400">
            Check your spam folder or contact{' '}
            <a href="mailto:support@bridge.com" className="text-purple-600 hover:underline">
              support@bridge.com
            </a>
          </p>
        </div>

        {/* Session ID (for debugging) */}
        {sessionId && (
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs text-gray-500 text-center">
            Session ID: {sessionId.substring(0, 20)}...
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
