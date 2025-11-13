"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

// Pricing configuration
const PRICING_PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 10,
    description: "Perfect for individuals and small families",
    features: [
      "50 documents per month",
      "AI-powered translation",
      "100+ languages",
      "Smart summaries",
      "Basic support",
      "14-day free trial",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Professional",
    price: 29,
    description: "For families with regular document needs",
    features: [
      "Unlimited documents",
      "Priority AI translation",
      "100+ languages",
      "Advanced summaries",
      "Family sharing (up to 5 members)",
      "Priority support",
      "14-day free trial",
      "Export to multiple formats",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "For organizations and institutions",
    features: [
      "Unlimited documents",
      "Dedicated AI resources",
      "Custom integrations",
      "API access",
      "Team management",
      "24/7 dedicated support",
      "Custom SLA",
      "White-label options",
    ],
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubscribe = async (planId: string) => {
    if (planId === "enterprise") {
      // Redirect to contact for enterprise
      window.location.href = "mailto:sales@bridge.com?subject=Enterprise Plan Inquiry";
      return;
    }

    setLoading(planId);
    setError("");

    try {
      // Call the checkout API to create a Stripe session
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: `price_${planId}`, // This should match your Stripe price IDs
          // Email will be collected in Stripe Checkout
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Bridge
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/sign-in"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/70 backdrop-blur-2xl rounded-2xl shadow-xl p-8 border-2 transition-all duration-200 ${
                plan.popular
                  ? "border-purple-500 scale-105 shadow-2xl"
                  : "border-white/40 hover:border-purple-200 hover:shadow-2xl"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {plan.description}
                </p>
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  {typeof plan.price === "number" ? (
                    <>
                      ${plan.price}
                      <span className="text-xl text-gray-600 font-normal">/month</span>
                    </>
                  ) : (
                    <span className="text-3xl">{plan.price}</span>
                  )}
                </div>
                {typeof plan.price === "number" && (
                  <p className="text-sm text-gray-500">
                    First 14 days free
                  </p>
                )}
              </div>

              {/* Features List */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle
                      className={`w-5 h-5 mr-3 flex-shrink-0 mt-0.5 ${
                        plan.popular ? "text-purple-600" : "text-gray-400"
                      }`}
                    />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading !== null}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.popular
                    ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:shadow-xl hover:scale-105"
                    : "bg-white border-2 border-gray-200 text-gray-900 hover:border-purple-300 hover:shadow-lg"
                }`}
              >
                {loading === plan.id ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading...
                  </span>
                ) : plan.id === "enterprise" ? (
                  "Contact Sales"
                ) : (
                  "Start Free Trial"
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes! You can cancel your subscription at any time. Your access will continue until the end of your billing period.",
              },
              {
                q: "What happens after the free trial?",
                a: "After 14 days, your chosen plan will automatically activate. You'll be charged monthly unless you cancel before the trial ends.",
              },
              {
                q: "Can I change plans later?",
                a: "Absolutely! You can upgrade or downgrade your plan at any time from your account settings.",
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-white/70 backdrop-blur-2xl rounded-xl p-6 border border-white/40">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-purple-600 hover:text-purple-700">
              Log in here
            </Link>
          </p>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
