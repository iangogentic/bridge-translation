"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  // Auto-redirect to pricing after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/pricing");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-10 w-64 h-64 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-10 left-1/2 w-64 h-64 bg-gradient-to-br from-pink-400 to-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Title and Message */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Bridge Requires a Subscription
          </h1>
          <p className="text-xl text-gray-700 mb-2">
            Bridge is a paid service that helps immigrant families translate important documents
          </p>
          <p className="text-gray-600">
            Choose a plan to get started with unlimited translations, AI summaries, and more
          </p>
        </div>

        {/* Paywall Card */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-2xl shadow-2xl p-8 border border-white/40">
          {/* Features */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What you'll get:</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: "🌍", text: "100+ Languages" },
                { icon: "🤖", text: "AI-Powered Translation" },
                { icon: "📄", text: "Unlimited Documents" },
                { icon: "✨", text: "Smart Summaries" },
                { icon: "🔒", text: "HIPAA Compliant" },
                { icon: "👨‍👩‍👧", text: "Family Sharing" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border-2 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-1">
                  Special Offer
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  14-Day Free Trial
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Try Bridge risk-free • Cancel anytime
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Starting at</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  $10
                  <span className="text-lg">/mo</span>
                </p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link href="/pricing">
              <button className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                View Pricing Plans →
              </button>
            </Link>

            <p className="text-center text-sm text-gray-600">
              Already subscribed?{" "}
              <Link
                href="/login"
                className="font-semibold text-purple-600 hover:text-purple-700 transition-colors"
              >
                Log in here
              </Link>
            </p>
          </div>

          {/* Auto-redirect notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Redirecting to pricing page in a few seconds...
            </p>
          </div>
        </div>

        {/* Back to home link */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
