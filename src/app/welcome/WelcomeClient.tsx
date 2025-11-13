/**
 * Welcome Page Client Component
 *
 * Users land here after completing account setup.
 * Provides onboarding and quick start guide.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

export default function WelcomeClient() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const steps = [
    {
      title: 'Welcome to Bridge! 🎉',
      description: 'Your account is ready. Let\'s get you started with translating documents.',
      icon: (
        <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Upload Documents',
      description: 'Drag and drop PDFs, images, or scanned documents in any language.',
      icon: (
        <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
    },
    {
      title: 'AI Translation',
      description: 'Our AI automatically detects the language and translates to English with context.',
      icon: (
        <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: 'Get Smart Summaries',
      description: 'Extract key information: deadlines, costs, required actions, and more.',
      icon: (
        <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push('/dashboard');
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="p-6">
        <button
          onClick={handleSkip}
          className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Skip tutorial →
        </button>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4" style={{ minHeight: 'calc(100vh - 100px)' }}>
        <div className="max-w-2xl w-full">
          {/* Step Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="p-6 bg-white rounded-3xl shadow-lg">
                {step.icon}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {step.title}
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-600 mb-12 max-w-xl mx-auto">
              {step.description}
            </p>

            {/* Progress Dots */}
            <div className="flex justify-center items-center gap-2 mb-12">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-purple-600 w-8'
                      : 'bg-gray-300 w-2 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-center">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 transition-all"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>

          {/* User Info Card */}
          {currentStep === 0 && (
            <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user.firstName?.charAt(0).toUpperCase() || user.emailAddresses[0]?.emailAddress?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.emailAddresses[0]?.emailAddress}</h3>
                  <p className="text-sm text-gray-600">{user.emailAddresses[0]?.emailAddress}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Plan</p>
                  <p className="font-semibold text-purple-600 capitalize">
                    Starter
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          {currentStep === steps.length - 1 && (
            <div className="mt-12 grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">100+</div>
                <div className="text-sm text-gray-600 mt-1">Languages</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">99.9%</div>
                <div className="text-sm text-gray-600 mt-1">Accuracy</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="text-3xl font-bold text-green-600">&lt;2min</div>
                <div className="text-sm text-gray-600 mt-1">Avg. Time</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Help Text */}
      <div className="text-center pb-6">
        <p className="text-sm text-gray-500">
          Need help? Visit our{' '}
          <a href="#" className="text-purple-600 hover:underline font-medium">
            Help Center
          </a>
        </p>
      </div>
    </div>
  );
}
