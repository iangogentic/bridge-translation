/**
 * Document Viewer Page - Premium Side-by-Side Layout
 * Beautiful split-screen view with glassmorphism design
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DocumentData {
  id: string;
  filename: string;
  blobUrl: string;
  mimeType: string;
  uploadedAt: string;
}

interface ResultData {
  translation_html: string;
  summary: {
    purpose: string;
    actions: string[];
    due_dates?: string[];
    costs?: string[];
  };
  detected_language: string;
  confidence?: number;
}

type View = 'translation' | 'summary';

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>('translation');
  const [docData, setDocData] = useState<DocumentData | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch document metadata
        const docRes = await fetch(`/api/doc/${id}`);
        if (!docRes.ok) throw new Error('Document not found');
        const documentData = await docRes.json();
        setDocData(documentData);

        // Fetch translation result
        const resultRes = await fetch(`/api/doc/${id}/result`);
        if (!resultRes.ok) throw new Error('Result not found');
        const resultData = await resultRes.json();
        setResult(resultData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/doc/${id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'txt' }),
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `translation-${id}.txt`;
      a.click();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/doc/${id}/delete`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      // Redirect to dashboard after successful deletion
      router.push('/dashboard');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete document. Please try again.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
            <svg className="w-10 h-10 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-900">Loading document...</p>
          <p className="text-sm text-gray-600 mt-2">Preparing your translation</p>
        </div>
      </div>
    );
  }

  if (error || !docData || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden flex items-center justify-center">
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-md mx-auto text-center relative z-10">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/40">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Document Not Found</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">{error || 'The document you are looking for does not exist or has been deleted.'}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl hover:scale-105 duration-300"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Premium Navigation */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-sm relative">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="group flex items-center gap-3 hover:opacity-90 transition-all">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-extrabold text-lg">B</span>
              </div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Bridge</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 text-sm font-bold text-gray-700 hover:text-gray-900 transition-colors hover:scale-105 duration-300"
              >
                Dashboard
              </Link>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="group px-5 py-2.5 bg-red-50/80 backdrop-blur-sm text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-all border border-red-200 hover:border-red-300 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 duration-300"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
              <button
                onClick={handleExport}
                className="group px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 duration-300 flex items-center gap-2"
              >
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Document Title Bar with Glassmorphism */}
      <div className="bg-white/60 backdrop-blur-xl border-b border-white/30 py-5 relative">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-gray-900">{docData.filename}</h1>
                <p className="text-sm text-gray-600 font-medium mt-0.5">
                  {new Date(docData.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
            {result.confidence && (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-white">{result.confidence}% confidence</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Premium Side by Side */}
      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-260px)]">
          {/* Left Panel - Original Document with Glassmorphism */}
          <div className="group bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden flex flex-col hover:shadow-3xl transition-all duration-500">
            <div className="bg-gradient-to-r from-gray-100/80 to-gray-200/80 backdrop-blur-sm border-b border-white/30 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900">Original Document</h2>
                    <div className="mt-1 px-3 py-1 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full inline-block">
                      <span className="text-xs font-bold text-white">{result.detected_language.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50/50 to-gray-100/50">
              {docData.mimeType === 'application/pdf' ? (
                <iframe
                  src={docData.blobUrl}
                  className="w-full h-full border-0"
                  title={docData.filename}
                />
              ) : (
                <div className="flex items-center justify-center h-full p-6">
                  <img
                    src={docData.blobUrl}
                    alt={docData.filename}
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-xl"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Translation & Summary with Premium Tabs */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden flex flex-col hover:shadow-3xl transition-all duration-500">
            {/* Premium Tab Header */}
            <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 backdrop-blur-sm border-b border-white/30">
              <div className="flex">
                <button
                  onClick={() => setActiveView('translation')}
                  className={`group flex-1 px-8 py-5 font-bold text-sm transition-all duration-300 ${
                    activeView === 'translation'
                      ? 'bg-white/90 backdrop-blur-sm border-b-4 border-blue-600 text-blue-600 shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 hover:scale-105'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg className={`w-5 h-5 ${activeView === 'translation' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    <span>Translation</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveView('summary')}
                  className={`group flex-1 px-8 py-5 font-bold text-sm transition-all duration-300 ${
                    activeView === 'summary'
                      ? 'bg-white/90 backdrop-blur-sm border-b-4 border-blue-600 text-blue-600 shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 hover:scale-105'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <svg className={`w-5 h-5 ${activeView === 'summary' ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span>AI Summary</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Content Area with Smooth Transitions */}
            <div className="flex-1 overflow-auto p-8">
              {activeView === 'translation' ? (
                <div className="animate-in fade-in duration-500">
                  <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-200">
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-md">
                      <span className="text-sm font-bold text-white">EN</span>
                    </div>
                    <span className="text-lg font-extrabold text-gray-900">English Translation</span>
                  </div>
                  <div
                    className="prose prose-base max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-ul:text-gray-700 prose-li:my-1"
                    dangerouslySetInnerHTML={{ __html: result.translation_html }}
                  />
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in duration-500">
                  {/* Purpose Card */}
                  <div className="group bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-xl text-gray-900 mb-3">What is this document about?</h3>
                        <p className="text-gray-700 leading-relaxed font-medium">{result.summary.purpose}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {result.summary.actions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="font-extrabold text-xl text-gray-900">What do I need to do?</h3>
                      </div>
                      <ul className="space-y-3">
                        {result.summary.actions.map((action, i) => (
                          <li key={i} className="group flex items-start gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-white/60 hover:border-purple-300 hover:shadow-lg transition-all duration-300 hover:scale-105">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-white flex items-center justify-center text-sm font-bold shadow-md group-hover:scale-110 transition-transform">
                              {i + 1}
                            </span>
                            <span className="text-gray-700 pt-1 font-medium leading-relaxed">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Due Dates */}
                  {result.summary.due_dates && result.summary.due_dates.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="font-extrabold text-xl text-gray-900">Important Dates</h3>
                      </div>
                      <ul className="space-y-3">
                        {result.summary.due_dates.map((date, i) => (
                          <li key={i} className="group flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-orange-200/60 hover:shadow-lg transition-all duration-300 hover:scale-105">
                            <svg className="w-6 h-6 text-orange-600 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-gray-700 font-medium">{date}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Costs */}
                  {result.summary.costs && result.summary.costs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h3 className="font-extrabold text-xl text-gray-900">Costs & Fees</h3>
                      </div>
                      <ul className="space-y-3">
                        {result.summary.costs.map((cost, i) => (
                          <li key={i} className="group flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-5 border border-green-200/60 hover:shadow-lg transition-all duration-300 hover:scale-105">
                            <svg className="w-6 h-6 text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="text-gray-700 font-medium">{cost}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-3xl max-w-md w-full p-10 animate-in zoom-in duration-300 border border-white/40">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-3xl font-extrabold text-gray-900 text-center mb-3">Delete Document?</h3>
            <p className="text-gray-600 text-center mb-8 leading-relaxed">
              This will permanently delete <span className="font-bold text-gray-900">{docData.filename}</span> and all its translations. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-8 py-4 bg-gray-100/80 backdrop-blur-sm text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-2xl hover:from-red-700 hover:to-red-800 transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-105 duration-300"
              >
                {deleting ? (
                  <>
                    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
