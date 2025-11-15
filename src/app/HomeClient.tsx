'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser, useClerk } from '@clerk/nextjs';

type FileStatus = 'pending' | 'uploading' | 'translating' | 'done' | 'error';

interface FileItem {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
  documentId?: string;
}

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const STATUS_STYLES: Record<FileStatus, { label: string; className: string }> = {
  pending: {
    label: 'Ready',
    className: 'bg-gray-100 text-gray-700 border border-gray-200',
  },
  uploading: {
    label: 'Uploading',
    className: 'bg-blue-100 text-blue-800 border border-blue-200',
  },
  translating: {
    label: 'Translating',
    className: 'bg-purple-100 text-purple-800 border border-purple-200',
  },
  done: {
    label: 'Done',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
  error: {
    label: 'Error',
    className: 'bg-red-100 text-red-800 border border-red-200',
  },
};

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const validateFile = (selectedFile: File): string | null => {
  if (!ALLOWED_TYPES.includes(selectedFile.type)) {
    return 'Please select a PDF, JPG, or PNG file';
  }

  if (selectedFile.size > MAX_FILE_SIZE) {
    return 'File size must be less than 10MB';
  }

  return null;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function HomeClient() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [targetLang, setTargetLang] = useState('en');

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    const nextItems = selectedFiles.map((selectedFile, index) => {
      const validationError = validateFile(selectedFile);
      return {
        id: `${selectedFile.name}-${index}-${generateId()}`,
        file: selectedFile,
        status: validationError ? 'error' : 'pending',
        error: validationError || undefined,
      };
    });

    setFileItems(nextItems);
    setGlobalError(null);
    e.target.value = '';
  };

  const updateItem = (id: string, updates: Partial<FileItem>) => {
    setFileItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  };

  const parseJson = async (response: Response) => {
    try {
      return await response.json();
    } catch {
      return null;
    }
  };

  const handleStartProcessing = async () => {
    if (!fileItems.length) {
      setGlobalError('Please choose at least one file to translate.');
      return;
    }

    if (!user) {
      router.push('/sign-in');
      return;
    }

    if (isProcessing) return;

    setGlobalError(null);
    setIsProcessing(true);

    let latestDocumentId: string | null = null;
    let limitHit = false;

    for (const item of fileItems) {
      if (item.status !== 'pending') continue;

      updateItem(item.id, { status: 'uploading', error: undefined });

      try {
        const formData = new FormData();
        formData.append('file', item.file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await parseJson(uploadRes);

        if (!uploadRes.ok || !uploadData) {
          const message = uploadData?.error || 'Upload failed';
          throw new Error(message);
        }

        updateItem(item.id, { status: 'translating' });

        const translateRes = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl: uploadData.url,
            filename: item.file.name,
            mimeType: item.file.type,
            fileSize: item.file.size,
            targetLang,
          }),
        });

        const translateData = await parseJson(translateRes);

        if (!translateRes.ok || !translateData) {
          if (translateData?.code === 'TRANSLATION_LIMIT_EXCEEDED') {
            const message =
              translateData.message ||
              'You have reached your translation limit. Please upgrade to continue.';
            updateItem(item.id, { status: 'error', error: message });
            setGlobalError(message);
            limitHit = true;
            break;
          }

          const message = translateData?.message || translateData?.error || 'Translation failed';
          throw new Error(message);
        }

        latestDocumentId = translateData.documentId;
        updateItem(item.id, { status: 'done', documentId: translateData.documentId });
      } catch (err) {
        updateItem(item.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Something went wrong',
        });
      }
    }

    setIsProcessing(false);

    if (limitHit) {
      return;
    }

    if (latestDocumentId) {
      router.push(`/doc/${latestDocumentId}`);
    } else {
      setGlobalError((prev) => prev ?? 'No files were processed. Please fix the errors above and try again.');
    }
  };

  const hasPendingWork = fileItems.some((item) => item.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation Header */}
      <nav className="bg-white/95 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-20 md:h-24">
            {/* Logo - Much Larger */}
            <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-all duration-300 hover:scale-105">
              <Image
                src="/logo.png"
                alt="Bridge Logo"
                width={800}
                height={178}
                className="h-14 md:h-20 w-auto"
                priority
              />
            </Link>

            {/* Navigation Links - Right side with better spacing */}
            <div className="flex items-center gap-3 md:gap-4">
              {isLoaded && user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-semibold text-gray-700 hover:text-gray-900 transition-all duration-200 hover:bg-gray-100 rounded-xl"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-semibold text-gray-700 hover:text-gray-900 transition-all duration-200 hover:bg-gray-100 rounded-xl"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="px-4 md:px-6 py-2.5 md:py-3 text-sm md:text-base font-semibold text-gray-700 hover:text-gray-900 transition-all duration-200 hover:bg-gray-100 rounded-xl"
                  >
                    Login
                  </Link>
                  <Link
                    href="/sign-up"
                    className="px-5 md:px-8 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm md:text-base font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header with Gradient Text */}
          <div className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 bg-white/60 backdrop-blur-md border border-white/40 rounded-full mb-6 md:mb-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <span className="text-xl md:text-2xl">🌐</span>
              <span className="text-xs md:text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Now supporting 100+ languages
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 leading-tight px-4">
              <span className="text-gray-900">Official documents, </span>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                made simple
              </span>
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
              AI-powered translation assistant that helps immigrant families understand and complete paperwork with confidence.
            </p>
          </div>

          {/* Upload Card with Glassmorphism */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 border border-white/40 hover:shadow-3xl transition-all duration-500">
            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-900 mb-2">
                Upload a document
              </label>
              <p className="text-sm text-gray-600 mb-5 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                PDF, JPG, or PNG • Maximum 10MB
              </p>

              {/* File Upload */}
              <div className="mb-6">
                <label htmlFor="file-upload" className="block text-sm font-semibold text-gray-700 mb-3">
                  📁 Choose File
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  className="block w-full text-sm text-gray-900
                    file:mr-4 file:py-3 file:px-4
                    file:rounded-lg file:border-0
                    file:text-xs file:font-bold
                    file:bg-gradient-to-r file:from-blue-600 file:to-blue-700
                    file:text-white
                    hover:file:from-blue-700 hover:file:to-blue-800
                    file:cursor-pointer file:transition-all file:duration-300
                    file:shadow-lg hover:file:shadow-xl
                    cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {fileItems.length > 0 && (
              <div className="mb-6 space-y-4">
                {fileItems.map((item) => {
                  const style = STATUS_STYLES[item.status];
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-white/80 backdrop-blur rounded-2xl border border-white/60 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{item.file.name}</p>
                            <p className="text-xs text-gray-600 mt-1 flex flex-wrap gap-3">
                              <span>{formatFileSize(item.file.size)}</span>
                              <span className="text-gray-400">•</span>
                              <span>{item.file.type || 'Unknown type'}</span>
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${style.className}`}
                        >
                          {style.label}
                        </span>
                      </div>
                      {item.error && (
                        <p className="mt-3 text-sm font-medium text-red-600">{item.error}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Language Selection */}
            <div className="mb-6">
              <label
                htmlFor="language-select"
                className="block text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"
              >
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Target language
              </label>
              <p className="text-xs text-gray-600 mb-4">
                Choose your preferred language for translation
              </p>
              <select
                id="language-select"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                disabled={isProcessing}
                className="block w-full px-5 py-4 bg-white/90 border-2 border-gray-200
                  rounded-xl text-base font-medium text-gray-900 focus:outline-none focus:ring-4
                  focus:ring-purple-200 focus:border-purple-400 disabled:opacity-50
                  disabled:cursor-not-allowed cursor-pointer hover:border-purple-300
                  transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="vi">Vietnamese</option>
                <option value="zh">Chinese Simplified</option>
                <option value="fr">French</option>
                <option value="ar">Arabic</option>
                <option value="ko">Korean</option>
                <option value="ja">Japanese</option>
                <option value="pt">Portuguese</option>
                <option value="de">German</option>
              </select>
            </div>

            {globalError && (
              <div className="mb-8 p-5 bg-red-50/90 backdrop-blur-sm border-2 border-red-200 rounded-2xl animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-red-900">{globalError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleStartProcessing}
              disabled={!hasPendingWork || isProcessing}
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-semibold
                rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4
                focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300 text-base shadow-lg hover:shadow-xl hover:scale-105
                relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing your documents...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start translations
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </button>

            {/* Privacy Note */}
            <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200/50 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">Your Privacy Matters</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Your documents are processed securely and are not stored permanently.
                    Files are automatically deleted after 48 hours.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Badges */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-medium">HIPAA compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium">End-to-end encrypted</span>
              </div>
            </div>
          </div>

          {/* Features with Enhanced Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group text-center p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 hover:bg-white/80">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base">Lightning Fast</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Get translation results in under 2 seconds with our optimized AI pipeline</p>
            </div>

            <div className="group text-center p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 hover:bg-white/80">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base">Highly Accurate</h3>
              <p className="text-sm text-gray-600 leading-relaxed">GPT-4 powered translation ensures context-aware, natural-sounding results</p>
            </div>

            <div className="group text-center p-6 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105 hover:bg-white/80">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-base">Bank-Level Security</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Your documents are protected with end-to-end encryption and auto-deletion</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
